import { VCardContact } from './vcard.models';

/** Datos públicos de contacto comercial (alineados con la landing). */
export const DEFAULT_BRAND_VCARD: VCardContact = {
  fullName: 'Condominio A Un Clic',
  organization: 'Condominio A Un Clic',
  title: 'Representante comercial — administración de condominios',
  email: 'condominioaunclic@gmail.com',
  cellPhone: '+58 424 2475572',
  workPhone: '+58 212 7105278',
  addressLocality: 'Caracas',
  addressCountry: 'Venezuela',
  website: 'https://www.condominioaunclic.online',
  note:
    'Plataforma SaaS para administración de condominios: recibos, estados de cuenta, pagos y portal de propietarios.'
};
