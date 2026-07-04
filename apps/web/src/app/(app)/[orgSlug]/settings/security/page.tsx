'use client';

import { useState } from 'react';

import { useDisableTotp, useEnableTotp, useSetupTotp, useTotpStatus } from '@/lib/hooks/use-totp';

type SetupStep = 'idle' | 'qr' | 'confirm' | 'done';
type DisableStep = 'idle' | 'confirm';

export default function SecuritySettingsPage() {
  const { data: status, isLoading } = useTotpStatus();

  const setupTotp = useSetupTotp();
  const enableTotp = useEnableTotp();
  const disableTotp = useDisableTotp();

  const [setupStep, setSetupStep] = useState<SetupStep>('idle');
  const [disableStep, setDisableStep] = useState<DisableStep>('idle');
  const [qrData, setQrData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
  const [enableCode, setEnableCode] = useState('');
  const [disableCode, setDisableCode] = useState('');
  const [enableError, setEnableError] = useState('');
  const [disableError, setDisableError] = useState('');

  async function handleStartSetup() {
    const data = await setupTotp.mutateAsync();
    setQrData(data);
    setSetupStep('qr');
  }

  async function handleEnable(e: React.FormEvent) {
    e.preventDefault();
    setEnableError('');
    try {
      await enableTotp.mutateAsync(enableCode);
      setSetupStep('done');
      setEnableCode('');
    } catch {
      setEnableError('Invalid code. Make sure your device clock is correct and try again.');
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setDisableError('');
    try {
      await disableTotp.mutateAsync(disableCode);
      setDisableStep('idle');
      setDisableCode('');
    } catch {
      setDisableError('Invalid code. Try again.');
    }
  }

  function handleCancelSetup() {
    setSetupStep('idle');
    setQrData(null);
    setEnableCode('');
    setEnableError('');
  }

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-xl bg-gray-100" />;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Two-factor authentication</h2>
        <p className="mb-6 text-sm text-gray-500">
          Add an extra layer of security to your account using a time-based one-time password (TOTP)
          app like Google Authenticator or Authy.
        </p>

        {status?.enabled ? (
          <EnabledState
            disableStep={disableStep}
            setDisableStep={setDisableStep}
            disableCode={disableCode}
            setDisableCode={setDisableCode}
            disableError={disableError}
            onSubmit={handleDisable}
            isPending={disableTotp.isPending}
          />
        ) : (
          <DisabledState
            setupStep={setupStep}
            qrData={qrData}
            enableCode={enableCode}
            setEnableCode={setEnableCode}
            enableError={enableError}
            onStartSetup={handleStartSetup}
            onEnable={handleEnable}
            onCancel={handleCancelSetup}
            isSetupPending={setupTotp.isPending}
            isEnablePending={enableTotp.isPending}
          />
        )}
      </div>
    </div>
  );
}

function EnabledState({
  disableStep,
  setDisableStep,
  disableCode,
  setDisableCode,
  disableError,
  onSubmit,
  isPending,
}: {
  disableStep: DisableStep;
  setDisableStep: (s: DisableStep) => void;
  disableCode: string;
  setDisableCode: (v: string) => void;
  disableError: string;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Enabled
        </span>
        <span className="text-sm text-gray-500">
          Your account is protected with two-factor authentication.
        </span>
      </div>

      {disableStep === 'idle' ? (
        <button
          onClick={() => setDisableStep('confirm')}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          Disable 2FA
        </button>
      ) : (
        <form onSubmit={onSubmit} className="max-w-sm space-y-3">
          <p className="text-sm text-gray-600">Enter your 6-digit authenticator code to confirm.</p>
          <input
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            value={disableCode}
            onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {disableError && <p className="text-sm text-red-600">{disableError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isPending || disableCode.length !== 6}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isPending ? 'Disabling…' : 'Confirm disable'}
            </button>
            <button
              type="button"
              onClick={() => setDisableStep('idle')}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function DisabledState({
  setupStep,
  qrData,
  enableCode,
  setEnableCode,
  enableError,
  onStartSetup,
  onEnable,
  onCancel,
  isSetupPending,
  isEnablePending,
}: {
  setupStep: SetupStep;
  qrData: { qrCodeDataUrl: string; secret: string } | null;
  enableCode: string;
  setEnableCode: (v: string) => void;
  enableError: string;
  onStartSetup: () => void;
  onEnable: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSetupPending: boolean;
  isEnablePending: boolean;
}) {
  if (setupStep === 'done') {
    return (
      <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4">
        <svg
          className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p className="text-sm font-medium text-green-800">Two-factor authentication enabled</p>
          <p className="mt-0.5 text-sm text-green-700">
            Your account is now protected. You will need your authenticator app on every login.
          </p>
        </div>
      </div>
    );
  }

  if (setupStep === 'idle') {
    return (
      <button
        onClick={onStartSetup}
        disabled={isSetupPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSetupPending ? 'Generating…' : 'Enable two-factor authentication'}
      </button>
    );
  }

  return (
    <div className="max-w-sm space-y-6">
      {setupStep === 'qr' && qrData && (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              1. Scan this QR code with your authenticator app
            </p>
            <img
              src={qrData.qrCodeDataUrl}
              alt="TOTP QR code"
              className="h-44 w-44 rounded-lg border border-gray-200"
            />
          </div>
          <div>
            <p className="mb-1 text-sm font-medium text-gray-700">Or enter this key manually</p>
            <code className="block break-all rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs text-gray-700">
              {qrData.secret}
            </code>
          </div>
          <button
            type="button"
            onClick={() => {
              document
                .getElementById('totp-confirm-section')
                ?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Continue to verify →
          </button>
        </div>
      )}

      <form id="totp-confirm-section" onSubmit={onEnable} className="space-y-3">
        <p className="text-sm font-medium text-gray-700">
          {setupStep === 'qr' ? '2. ' : ''}Enter the 6-digit code from your app to activate
        </p>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={enableCode}
          onChange={(e) => setEnableCode(e.target.value.replace(/\D/g, ''))}
          placeholder="000000"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {enableError && <p className="text-sm text-red-600">{enableError}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isEnablePending || enableCode.length !== 6}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isEnablePending ? 'Activating…' : 'Activate 2FA'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
