/**
 * ============================================
 * HOOK - STATUS DA LICENÇA
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Hook React para verificar status da licença
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';

interface LicenseStatus {
  valid: boolean;
  reason?: string;
  message?: string;
  expires?: string;
  daysRemaining?: number;
}

export function useLicenseStatus() {
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar licença
  const checkLicense = useCallback(async () => {
    if (!window.electron?.license) {
      console.warn('[License] APIs não disponíveis');
      return;
    }

    try {
      setIsChecking(true);
      setError(null);
      
      const result = await window.electron.license.check();
      
      setLicenseStatus({
        valid: result.valid === true,
        reason: result.reason,
        message: result.message,
        expires: result.expires,
        daysRemaining: result.daysRemaining
      });
    } catch (err: any) {
      console.error('[License] Erro ao verificar:', err);
      setError(err.message || 'Erro ao verificar licença');
      setLicenseStatus({
        valid: false,
        reason: 'CHECK_ERROR',
        message: err.message || 'Erro ao verificar licença'
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Verificar ao montar
  useEffect(() => {
    checkLicense();
  }, [checkLicense]);

  return {
    licenseStatus,
    isChecking,
    error,
    checkLicense
  };
}

