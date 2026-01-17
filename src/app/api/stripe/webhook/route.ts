/**
 * API Route: Stripe Webhook Handler
 * POST /api/stripe/webhook
 *
 * Maneja eventos de Stripe para sincronizar suscripciones
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Inicializar Stripe solo si la key está configurada
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// Supabase admin client para operaciones sin RLS
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null

// Webhook secret
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Mapeo de price IDs a tiers
const PRICE_TO_TIER: Record<string, 'pro' | 'premium'> = {
  [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: 'pro',
  [process.env.STRIPE_PRO_YEARLY_PRICE_ID || '']: 'pro',
  [process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '']: 'premium',
  [process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '']: 'premium'
}

export async function POST(request: NextRequest) {
  // Verificar configuración
  if (!stripe || !supabaseAdmin || !webhookSecret) {
    console.error('Stripe webhook: Missing configuration')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 503 }
    )
  }

  // Obtener body raw y signature
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  // Verificar evento
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Procesar evento
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// =====================================================
// HANDLERS DE EVENTOS
// =====================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id
  const tier = session.metadata?.tier as 'pro' | 'premium'

  if (!userId || !tier) {
    console.error('Missing metadata in checkout session')
    return
  }

  // Obtener suscripción de Stripe
  const subscription = await stripe!.subscriptions.retrieve(session.subscription as string)

  // Actualizar en Supabase
  await supabaseAdmin!
    .from('user_subscriptions')
    .update({
      tier,
      status: 'active',
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  // Registrar evento
  await logSubscriptionEvent(userId, 'created', null, tier, session.id)

  console.log(`Checkout completed for user ${userId}, tier: ${tier}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Determinar tier desde price ID
  const priceId = subscription.items.data[0]?.price.id
  const tier = priceId ? PRICE_TO_TIER[priceId] : null

  // Obtener tier anterior
  const { data: current } = await supabaseAdmin!
    .from('user_subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .single()

  const fromTier = current?.tier

  // Mapear status de Stripe a nuestro enum
  const status = mapStripeStatus(subscription.status)

  // Actualizar suscripción
  await supabaseAdmin!
    .from('user_subscriptions')
    .update({
      tier: tier || fromTier,
      status,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  // Determinar tipo de evento
  if (tier && fromTier && tier !== fromTier) {
    const eventType = getTierOrder(tier) > getTierOrder(fromTier) ? 'upgraded' : 'downgraded'
    await logSubscriptionEvent(userId, eventType, fromTier, tier, subscription.id)
  }

  console.log(`Subscription updated for user ${userId}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.user_id

  if (!userId) {
    console.error('Missing user_id in subscription metadata')
    return
  }

  // Obtener tier anterior
  const { data: current } = await supabaseAdmin!
    .from('user_subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .single()

  // Revertir a starter
  await supabaseAdmin!
    .from('user_subscriptions')
    .update({
      tier: 'starter',
      status: 'canceled',
      stripe_subscription_id: null,
      stripe_price_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  // Registrar evento
  await logSubscriptionEvent(userId, 'canceled', current?.tier, 'starter', subscription.id)

  console.log(`Subscription deleted for user ${userId}`)
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  // Obtener usuario
  const { data: sub } = await supabaseAdmin!
    .from('user_subscriptions')
    .select('user_id, tier')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!sub) return

  // Si era un renewal
  if (invoice.billing_reason === 'subscription_cycle') {
    await logSubscriptionEvent(sub.user_id, 'renewed', sub.tier, sub.tier, invoice.id ?? undefined)
  }

  // Resetear contadores de uso para el nuevo período
  const periodStart = new Date()
  periodStart.setDate(1) // Primer día del mes

  await supabaseAdmin!
    .from('subscription_usage')
    .upsert({
      user_id: sub.user_id,
      period_start: periodStart.toISOString().split('T')[0],
      transactions_count: 0,
      cfo_messages_count: 0,
      receipt_scans_count: 0,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,period_start'
    })

  console.log(`Payment succeeded for user ${sub.user_id}`)
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string
  if (!subscriptionId) return

  // Obtener usuario
  const { data: sub } = await supabaseAdmin!
    .from('user_subscriptions')
    .select('user_id, tier')
    .eq('stripe_subscription_id', subscriptionId)
    .single()

  if (!sub) return

  // Actualizar status
  await supabaseAdmin!
    .from('user_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', sub.user_id)

  // Registrar evento
  await logSubscriptionEvent(sub.user_id, 'payment_failed', sub.tier, sub.tier, invoice.id ?? undefined)

  console.log(`Payment failed for user ${sub.user_id}`)
}

// =====================================================
// HELPERS
// =====================================================

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case 'active': return 'active'
    case 'canceled': return 'canceled'
    case 'past_due': return 'past_due'
    case 'trialing': return 'trialing'
    case 'incomplete':
    case 'incomplete_expired': return 'incomplete'
    default: return 'active'
  }
}

function getTierOrder(tier: string): number {
  switch (tier) {
    case 'starter': return 0
    case 'pro': return 1
    case 'premium': return 2
    default: return 0
  }
}

async function logSubscriptionEvent(
  userId: string,
  eventType: string,
  fromTier: string | null,
  toTier: string | null,
  stripeEventId?: string
) {
  await supabaseAdmin!
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: eventType,
      from_tier: fromTier,
      to_tier: toTier,
      stripe_event_id: stripeEventId,
      metadata: {},
      created_at: new Date().toISOString()
    })
}
