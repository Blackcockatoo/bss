'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  UtensilsCrossed,
  Heart,
  ClipboardList,
  Gamepad2,
  Save,
  ChevronRight,
  X
} from 'lucide-react';
import { useLocale } from '@/lib/i18n';

const ONBOARDING_ICONS = [
  <Heart key="heart" className="w-12 h-12 text-pink-400" />,
  <UtensilsCrossed key="utensils" className="w-12 h-12 text-orange-400" />,
  <ClipboardList key="clipboard" className="w-12 h-12 text-cyan-400" />,
  <Gamepad2 key="gamepad" className="w-12 h-12 text-purple-400" />,
  <Save key="save" className="w-12 h-12 text-emerald-400" />,
];

const STORAGE_KEY = 'metapet-onboarding-complete';

interface OnboardingTutorialProps {
  onComplete?: () => void;
  forceShow?: boolean;
}

export function OnboardingTutorial({ onComplete, forceShow = false }: OnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const { strings } = useLocale();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const completed = localStorage.getItem(STORAGE_KEY);
    if (forceShow || completed !== 'true') {
      setIsVisible(true);
    }
    setHasChecked(true);
  }, [forceShow]);

  const handleNext = () => {
    if (currentStep < strings.onboarding.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsVisible(false);
    onComplete?.();
  };

  if (!hasChecked || !isVisible) return null;

  const step = strings.onboarding.steps[currentStep];
  const isLastStep = currentStep === strings.onboarding.steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            {strings.onboarding.steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-cyan-400'
                    : index < currentStep
                    ? 'bg-cyan-600'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
          <button
            onClick={handleSkip}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label={strings.onboarding.closeLabel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-4">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-800/50 rounded-full">
              {ONBOARDING_ICONS[currentStep]}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white">
            {step.title}
          </h2>

          <p className="text-zinc-300 leading-relaxed">
            {step.description}
          </p>

          {step.tip && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-sm text-cyan-200">
              💡 <span className="font-medium">{strings.onboarding.tipLabel}:</span> {step.tip}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            {currentStep + 1} {strings.onboarding.stepCount} {strings.onboarding.steps.length}
          </span>

          <div className="flex gap-2">
            {!isLastStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-zinc-400 hover:text-white"
              >
                {strings.onboarding.skip}
              </Button>
            )}
            <Button
              onClick={handleNext}
              size="sm"
              className="gap-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600"
            >
              {isLastStep ? strings.onboarding.letsGo : strings.onboarding.next}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function resetOnboarding() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
