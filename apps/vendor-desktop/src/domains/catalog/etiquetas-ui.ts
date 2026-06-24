export type ContextoUI = 'ventas' | 'catalogo'

export const LABEL_CAMPO: Record<string, Record<ContextoUI, string>> = {
  ifa:                { ventas: 'Principio activo',  catalogo: 'IFA / Principio activo' },
  concentracion:      { ventas: 'Dosis',              catalogo: 'Concentración / Dosis'  },
  formaFarmaceutica:  { ventas: 'Presentación',       catalogo: 'Forma farmacéutica'     },
  condicionVenta:     { ventas: '¿Necesita receta?',  catalogo: 'Condición de venta'     },
  requiereCadenaFrio: { ventas: 'Refrigerar',          catalogo: 'Cadena de frío'         },
  requiereLote:       { ventas: 'Con vencimiento',     catalogo: 'Requiere lote'          },
  nombreFabricante:   { ventas: 'Laboratorio',         catalogo: 'Fabricante'             },
}

export const LABEL_CONDICION_VENTA: Record<string, string> = {
  SIN_RECETA: 'Sin receta',
  CON_RECETA: 'Con receta',
  CONTROLADO: 'Controlado',
}

export const LABEL_TIPO_RECURSO: Record<string, string> = {
  MEDICAMENTO:      'Medicamento',
  PRODUCTO_GENERAL: 'Producto general',
  SERVICIO:         'Servicio',
}

export const LABEL_CATEGORIA_GENERAL: Record<string, string> = {
  CUIDADO_PERSONAL:  'Cuidado personal',
  BEBE:              'Bebé',
  DISPOSITIVO_MEDICO:'Dispositivo médico',
  SUPLEMENTO:        'Suplemento',
  HIGIENE:           'Higiene',
  OTRO:              'Otro',
}

export const LABEL_FORMA_FARMACEUTICA: Record<string, string> = {
  TABLETA:                   'Tableta',
  TABLETA_RECUBIERTA:        'Tableta recubierta',
  TABLETA_MASTICABLE:        'Tableta masticable',
  TABLETA_LIB_PROLONGADA:    'Tableta lib. prolongada',
  CAPSULA:                   'Cápsula',
  CAPSULA_BLANDA:            'Cápsula blanda',
  COMPRIMIDO:                'Comprimido',
  COMPRIMIDO_RECUBIERTO:     'Comprimido recubierto',
  COMPRIMIDO_MASTICABLE:     'Comprimido masticable',
  SOLUCION_ORAL:             'Solución oral',
  SOLUCION_INYECTABLE:       'Solución inyectable',
  SOLUCION_OFTALMICA:        'Solución oftálmica',
  SOLUCION_TOPICA:           'Solución tópica',
  SUSPENSION_ORAL:           'Suspensión oral',
  SUSPENSION_INYECTABLE:     'Suspensión inyectable',
  JARABE:                    'Jarabe',
  POLVO_SUSPENSION_ORAL:     'Polvo susp. oral',
  POLVO_SOLUCION_INYECTABLE: 'Polvo sol. inyectable',
  CREMA:                     'Crema',
  POMADA:                    'Pomada',
  UNGUENTO:                  'Ungüento',
  GEL:                       'Gel',
  OVULO:                     'Óvulo',
  SUPOSITORIO:               'Supositorio',
  AMPOLLA:                   'Ampolla',
  VIAL:                      'Vial',
  FRASCO_GOTERO:             'Frasco gotero',
  SPRAY:                     'Spray',
  INHALADOR:                 'Inhalador',
  PARCHE:                    'Parche',
  OTRO:                      'Otro',
}

export const LABEL_CATEGORIA_FARMACIA: Record<string, string> = {
  ANALGESICO:       'Analgésico',
  ANTIBIOTICO:      'Antibiótico',
  ANTIHISTAMINICO:  'Antihistamínico',
  ANTIINFLAMATORIO: 'Antiinflamatorio',
  ANTIACIDO:        'Antiácido',
  VITAMINA:         'Vitamina / Suplemento',
  TOPICO:           'Tópico',
  OFTALMICO:        'Oftálmico',
  INYECTABLE:       'Inyectable',
  DISPOSITIVO:      'Dispositivo',
  CUIDADO_PERSONAL: 'Cuidado personal',
  BEBE:             'Bebé',
  OTRO:             'Otro',
}

export const LABEL_TIPO_SERVICIO: Record<string, string> = {
  INYECTABLE:      'Aplicación inyectable',
  NEBULIZACION:    'Nebulización',
  CONTROL_GLUCOSA: 'Control de glucosa',
  CONTROL_PRESION: 'Control de presión',
  TEST_EMBARAZO:   'Test de embarazo',
  CURACION:        'Curación',
  OTRO:            'Otro servicio',
}
