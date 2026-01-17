/**
 * API Route: Create Stripe Checkout Session
 * POST /api/stripe/create-checkout
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

// Inicializar Stripe solo si la key está configurada
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

// Price IDs de Stripe (configurar en .env)
const PRICE_IDS = {
  pro: {
    month: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    year: process.env.STRIPE_PRO_YEARLY_PRICE_ID
  },
  premium: {
    month: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
    year: process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que Stripe está configurado
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      )
    }

    // Obtener usuario autenticado
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parsear body
    const body = await request.json()
    const { tier, interval, successUrl, cancelUrl } = body

    // Validar parámetros
    if (!tier || !['pro', 'premium'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be "pro" or "premium"' },
        { status: 400 }
      )
    }

    if (!interval || !['month', 'year'].includes(interval)) {
      return NextResponse.json(
        { error: 'Invalid interval. Must be "month" or "year"' },
        { status: 400 }
      )
    }

    // Obtener price ID
    const priceId = PRICE_IDS[tier as 'pro' | 'premium'][interval as 'month' | 'year']
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured for this tier and interval' },
        { status: 400 }
      )
    }

    // Verificar si usuario ya tiene stripe_customer_id
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = subscription?.stripe_customer_id

    // Crear o recuperar customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id
        }
      })
      customerId = customer.id

      // Guardar customer_id en la base de datos
      await supabase
        .from('user_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    // Crear sesión de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/settings/subscription?success=true`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/settings/subscription?canceled=true`,
      metadata: {
        user_id: user.id,
        tier,
        interval
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          tier
        }
      }
    })

    return NextResponse.json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
