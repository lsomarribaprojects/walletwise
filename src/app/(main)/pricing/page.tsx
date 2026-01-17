'use client'

import { PricingTable, useSubscription, UsageSummary } from '@/features/subscriptions'
import { NeuCard } from '@/shared/components/ui'
import { useLanguage } from '@/shared/i18n'

export default function PricingPage() {
  const { t } = useLanguage()
  const { tier, subscription, isLoading } = useSubscription()

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800">Plans & Pricing</h1>
        <p className="text-gray-500 mt-2">
          Choose the plan that fits your financial management needs
        </p>
      </div>

      {/* Current subscription info */}
      {!isLoading && subscription && (
        <NeuCard className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Plan</p>
              <p className="text-xl font-bold text-gray-800 capitalize">{tier}</p>
            </div>
            {subscription.current_period_end && (
              <div className="text-right">
                <p className="text-sm text-gray-500">Renews on</p>
                <p className="font-medium text-gray-800">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </NeuCard>
      )}

      {/* Pricing table */}
      <PricingTable highlightTier="pro" showCurrentBadge />

      {/* Usage summary for current tier */}
      {!isLoading && tier !== 'starter' && (
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Your Usage</h2>
          <UsageSummary />
        </div>
      )}

      {/* FAQs */}
      <div className="max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          <FaqItem
            question="Can I change my plan at any time?"
            answer="Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any payments."
          />
          <FaqItem
            question="What payment methods do you accept?"
            answer="We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment provider Stripe."
          />
          <FaqItem
            question="Is there a free trial?"
            answer="The Starter plan is completely free forever. You can upgrade to Pro or Premium anytime to unlock more features."
          />
          <FaqItem
            question="Can I cancel my subscription?"
            answer="Yes, you can cancel your subscription at any time from your account settings. You'll retain access until the end of your billing period."
          />
        </div>
      </div>
    </div>
  )
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <NeuCard size="sm">
      <h3 className="font-semibold text-gray-800 mb-2">{question}</h3>
      <p className="text-sm text-gray-600">{answer}</p>
    </NeuCard>
  )
}
