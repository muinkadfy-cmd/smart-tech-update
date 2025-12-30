/**
 * ============================================
 * CONFIGURAÇÃO DO SERVIDOR
 * Smart Tech Rolândia 2.0
 * ============================================
 * 
 * Configurações centralizadas do servidor Railway
 * 
 * @author Smart Tech Rolândia
 * @version 1.0.0
 */

/**
 * URL do servidor Railway
 * Use a URL real que o Railway gerou após o deploy
 */
export const SERVER_URL = 'https://smart-tech-server.up.railway.app';

/**
 * URL completa para atualizações
 */
export const UPDATE_URL = `${SERVER_URL}/update`;

/**
 * URL completa para licenças
 */
export const LICENSE_URL = `${SERVER_URL}/license`;

/**
 * Endpoints específicos
 */
export const ENDPOINTS = {
  health: `${SERVER_URL}/health`,
  updateLatest: `${UPDATE_URL}/latest`,
  licenseCheck: `${LICENSE_URL}/check`,
  licenseActivate: `${LICENSE_URL}/activate`
} as const;

