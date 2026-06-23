BEGIN TRANSACTION;

INSERT OR IGNORE INTO proveedor (id, razon_social, ruc, nombre_contacto, telefono, condiciones_pago, estado, creado_en) VALUES
  ('prov-001', 'LABORATORIOS PORTUGAL S.A.C.', '20512345678', 'Carlos Portugal', '073-456789', '30 días', 'ACTIVO', '2026-01-10T08:00:00'),
  ('prov-002', 'DISTRIBUIDORA MEDIC PHARMA E.I.R.L.', '20598765432', 'Rosa Medina', '073-987654', 'Contado', 'ACTIVO', '2026-01-15T09:00:00');

INSERT OR IGNORE INTO producto_generico (id, ifa, concentracion, forma_farmaceutica, categoria_farmacia, permite_fraccion, creado_en) VALUES
  ('gen-001', 'Paracetamol', '500 mg', 'Tableta', 'ANALGESICO', 1, '2026-01-10T08:00:00'),
  ('gen-002', 'Amoxicilina', '500 mg', 'Capsula', 'ANTIBIOTICO', 1, '2026-01-10T08:00:00'),
  ('gen-003', 'Ibuprofeno', '400 mg', 'Tableta', 'ANTIINFLAMATORIO', 1, '2026-01-10T08:00:00'),
  ('gen-004', 'Loratadina', '10 mg', 'Tableta', 'ANTIHISTAMINICO', 1, '2026-01-10T08:00:00'),
  ('gen-005', 'Metformina', '850 mg', 'Tableta', 'ANTIDIABETICO', 0, '2026-01-10T08:00:00');

INSERT OR IGNORE INTO producto_comercial (id, producto_generico_id, nombre_comercial, nombre_fabricante, nombre_titular, pais_origen, registro_sanitario, codigo_digemid, condicion_venta, requiere_lote, requiere_cadena_frio, estado, creado_en, modificado_en) VALUES
  ('pc-001', 'gen-001', 'Paracetamol Portugal', 'Lab. Portugal S.A.C.', 'Lab. Portugal S.A.C.', 'PE', 'E-23451', 'PAR500TAB', 'SIN_RECETA', 1, 0, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('pc-002', 'gen-001', 'Tachipirin', 'Angelini Pharma Peru', 'Angelini Pharma Peru', 'IT', 'E-19823', 'TAC500TAB', 'SIN_RECETA', 1, 0, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('pc-003', 'gen-002', 'Amoxaren', 'Farmindustria S.A.', 'Farmindustria S.A.', 'PE', 'E-11342', 'AMX500CAP', 'CON_RECETA', 1, 0, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('pc-004', 'gen-002', 'Amoxil', 'GlaxoSmithKline Peru', 'GlaxoSmithKline S.A.', 'GB', 'E-08921', 'AMO500CAP', 'CON_RECETA', 1, 0, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('pc-005', 'gen-003', 'Ibuprofeno Farmindustria', 'Farmindustria S.A.', 'Farmindustria S.A.', 'PE', 'E-14567', 'IBU400TAB', 'SIN_RECETA', 1, 0, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('pc-006', 'gen-004', 'Claritin', 'Bayer Peru S.A.', 'Bayer S.A.', 'DE', 'E-07654', 'CLA010TAB', 'SIN_RECETA', 1, 0, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('pc-007', 'gen-004', 'Loratadina Portugal', 'Lab. Portugal S.A.C.', 'Lab. Portugal S.A.C.', 'PE', 'E-23892', 'LOR010TAB', 'SIN_RECETA', 1, 0, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('pc-008', 'gen-005', 'Glucophage', 'Merck Peru S.A.', 'Merck S.A.', 'DE', 'E-06123', 'GLU850TAB', 'CON_RECETA', 1, 0, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00');

INSERT OR IGNORE INTO presentacion_comercial (id, producto_comercial_id, descripcion, fraccion_digemid, unidad_conteo, factor_conversion_base, codigo_barras, proveedor_habitual_id, costo_compra, stock_minimo, creado_en) VALUES
  ('pres-001', 'pc-001', 'Caja x 100 tabletas', 100.0, 'TABLETA', 100.0, '7750123400001', 'prov-001',  8.50, 10.0, '2026-01-10T08:00:00'),
  ('pres-002', 'pc-002', 'Caja x 24 tabletas',   24.0, 'TABLETA',  24.0, '7890123400002', 'prov-002', 12.00, 10.0, '2026-01-10T08:00:00'),
  ('pres-003', 'pc-003', 'Caja x 12 capsulas',   12.0, 'CAPSULA',  12.0, '7750456700003', 'prov-001', 15.00, 10.0, '2026-01-10T08:00:00'),
  ('pres-004', 'pc-004', 'Blistser x 8 capsulas',  8.0, 'CAPSULA',   8.0, '5000456700004', 'prov-002', 22.00, 10.0, '2026-01-10T08:00:00'),
  ('pres-005', 'pc-005', 'Caja x 20 tabletas',   20.0, 'TABLETA',  20.0, '7750789100005', 'prov-001', 11.00, 10.0, '2026-01-10T08:00:00'),
  ('pres-006', 'pc-006', 'Caja x 30 tabletas',   30.0, 'TABLETA',  30.0, '4001234500006', 'prov-002', 28.00, 10.0, '2026-01-10T08:00:00'),
  ('pres-007', 'pc-007', 'Caja x 10 tabletas',   10.0, 'TABLETA',  10.0, '7750123400007', 'prov-001',  5.50, 10.0, '2026-01-10T08:00:00'),
  ('pres-008', 'pc-008', 'Caja x 30 tabletas',   30.0, 'TABLETA',  30.0, '4014362600008', 'prov-002', 35.00, 20.0, '2026-01-10T08:00:00');

INSERT OR IGNORE INTO nodo_fraccionamiento (id, presentacion_id, nodo_padre_id, nombre_forma_venta, tipo_forma_venta, unidades_en_nodo_padre, unidades_base, es_vendible, es_comprable, estado, creado_en) VALUES
  ('nodo-001-raiz', 'pres-001', NULL, 'Caja x 100',   'PRESENTACION_ORIGINAL', NULL, 100.0, 1, 1, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-002-raiz', 'pres-002', NULL, 'Caja x 24',    'PRESENTACION_ORIGINAL', NULL,  24.0, 1, 1, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-003-raiz', 'pres-003', NULL, 'Caja x 12',    'PRESENTACION_ORIGINAL', NULL,  12.0, 1, 1, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-004-raiz', 'pres-004', NULL, 'Blister x 8',  'PRESENTACION_ORIGINAL', NULL,   8.0, 1, 1, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-005-raiz', 'pres-005', NULL, 'Caja x 20',    'PRESENTACION_ORIGINAL', NULL,  20.0, 1, 1, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-006-raiz', 'pres-006', NULL, 'Caja x 30',    'PRESENTACION_ORIGINAL', NULL,  30.0, 1, 1, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-007-raiz', 'pres-007', NULL, 'Caja x 10',    'PRESENTACION_ORIGINAL', NULL,  10.0, 1, 1, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-008-raiz', 'pres-008', NULL, 'Caja x 30',    'PRESENTACION_ORIGINAL', NULL,  30.0, 1, 1, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-001-frac', 'pres-001', 'nodo-001-raiz', 'Tableta unidad', 'FRACCION', 100.0, 1.0, 1, 0, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-003-frac', 'pres-003', 'nodo-003-raiz', 'Capsula unidad', 'FRACCION',  12.0, 1.0, 1, 0, 'ACTIVO', '2026-01-10T08:00:00'),
  ('nodo-005-frac', 'pres-005', 'nodo-005-raiz', 'Tableta unidad', 'FRACCION',  20.0, 1.0, 1, 0, 'ACTIVO', '2026-01-10T08:00:00');

INSERT OR IGNORE INTO lote (id, presentacion_id, numero_lote, fecha_vencimiento, fecha_fabricacion, cantidad_ingresada, cantidad_disponible, proveedor_id, precio_compra, estado, creado_en) VALUES
  ('lote-001-a', 'pres-001', 'PT-2024-001', '2027-03-31', '2024-03-01', 500.0, 500.0, 'prov-001',  8.50, 'VIGENTE', '2026-01-15T09:00:00'),
  ('lote-001-b', 'pres-001', 'PT-2024-089', '2026-11-30', '2024-11-01', 300.0, 300.0, 'prov-001',  8.00, 'VIGENTE', '2026-03-10T09:00:00'),
  ('lote-002-a', 'pres-002', 'ANG-24-1234', '2027-06-30', '2024-06-01', 120.0, 120.0, 'prov-002', 12.00, 'VIGENTE', '2026-01-20T10:00:00'),
  ('lote-002-b', 'pres-002', 'ANG-24-5678', '2027-09-30', '2024-09-01',  96.0,  96.0, 'prov-002', 11.50, 'VIGENTE', '2026-04-05T10:00:00'),
  ('lote-003-a', 'pres-003', 'FI-2024-321', '2026-08-31', '2024-08-01', 240.0, 240.0, 'prov-001', 15.00, 'VIGENTE', '2026-02-01T08:30:00'),
  ('lote-003-b', 'pres-003', 'FI-2025-100', '2027-12-31', '2025-01-01', 360.0, 360.0, 'prov-001', 14.50, 'VIGENTE', '2026-05-15T08:30:00'),
  ('lote-004-a', 'pres-004', 'GSK-24-9001', '2027-01-31', '2024-01-01',  80.0,  80.0, 'prov-002', 22.00, 'VIGENTE', '2026-02-10T09:00:00'),
  ('lote-004-b', 'pres-004', 'GSK-24-9045', '2027-04-30', '2024-04-01', 160.0, 160.0, 'prov-002', 21.00, 'VIGENTE', '2026-04-20T09:00:00'),
  ('lote-005-a', 'pres-005', 'FI-2024-555', '2027-02-28', '2024-02-01', 400.0, 400.0, 'prov-001', 11.00, 'VIGENTE', '2026-01-25T10:00:00'),
  ('lote-005-b', 'pres-005', 'FI-2025-200', '2028-01-31', '2025-01-01', 200.0, 200.0, 'prov-001', 10.50, 'VIGENTE', '2026-06-01T10:00:00'),
  ('lote-006-a', 'pres-006', 'BAY-24-3311', '2027-05-31', '2024-05-01', 150.0, 150.0, 'prov-002', 28.00, 'VIGENTE', '2026-02-15T11:00:00'),
  ('lote-006-b', 'pres-006', 'BAY-25-0012', '2028-02-28', '2025-02-01',  90.0,  90.0, 'prov-002', 27.00, 'VIGENTE', '2026-05-20T11:00:00'),
  ('lote-007-a', 'pres-007', 'PT-2024-442', '2026-10-31', '2024-10-01', 200.0, 200.0, 'prov-001',  5.50, 'VIGENTE', '2026-02-20T08:00:00'),
  ('lote-007-b', 'pres-007', 'PT-2025-110', '2027-10-31', '2025-10-01', 300.0, 300.0, 'prov-001',  5.00, 'VIGENTE', '2026-05-10T08:00:00'),
  ('lote-008-a', 'pres-008', 'MRK-24-7001', '2027-08-31', '2024-08-01', 120.0, 120.0, 'prov-002', 35.00, 'VIGENTE', '2026-03-01T09:00:00'),
  ('lote-008-b', 'pres-008', 'MRK-25-0055', '2028-06-30', '2025-06-01', 180.0, 180.0, 'prov-002', 34.00, 'VIGENTE', '2026-06-10T09:00:00');

INSERT OR IGNORE INTO movimiento (id, item_id, tipo, unidades_base, lote_id, nodo_id, causa, referencia_id, operador_id, timestamp, runtime_id) VALUES
  ('mov-001-a', 'pres-001', 'ENTRADA', 500.0, 'lote-001-a', 'nodo-001-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-01-15T09:05:00', 'seed-runtime'),
  ('mov-001-b', 'pres-001', 'ENTRADA', 300.0, 'lote-001-b', 'nodo-001-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-03-10T09:05:00', 'seed-runtime'),
  ('mov-002-a', 'pres-002', 'ENTRADA', 120.0, 'lote-002-a', 'nodo-002-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-01-20T10:05:00', 'seed-runtime'),
  ('mov-002-b', 'pres-002', 'ENTRADA',  96.0, 'lote-002-b', 'nodo-002-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-04-05T10:05:00', 'seed-runtime'),
  ('mov-003-a', 'pres-003', 'ENTRADA', 240.0, 'lote-003-a', 'nodo-003-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-02-01T08:35:00', 'seed-runtime'),
  ('mov-003-b', 'pres-003', 'ENTRADA', 360.0, 'lote-003-b', 'nodo-003-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-05-15T08:35:00', 'seed-runtime'),
  ('mov-004-a', 'pres-004', 'ENTRADA',  80.0, 'lote-004-a', 'nodo-004-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-02-10T09:05:00', 'seed-runtime'),
  ('mov-004-b', 'pres-004', 'ENTRADA', 160.0, 'lote-004-b', 'nodo-004-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-04-20T09:05:00', 'seed-runtime'),
  ('mov-005-a', 'pres-005', 'ENTRADA', 400.0, 'lote-005-a', 'nodo-005-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-01-25T10:05:00', 'seed-runtime'),
  ('mov-005-b', 'pres-005', 'ENTRADA', 200.0, 'lote-005-b', 'nodo-005-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-06-01T10:05:00', 'seed-runtime'),
  ('mov-006-a', 'pres-006', 'ENTRADA', 150.0, 'lote-006-a', 'nodo-006-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-02-15T11:05:00', 'seed-runtime'),
  ('mov-006-b', 'pres-006', 'ENTRADA',  90.0, 'lote-006-b', 'nodo-006-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-05-20T11:05:00', 'seed-runtime'),
  ('mov-007-a', 'pres-007', 'ENTRADA', 200.0, 'lote-007-a', 'nodo-007-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-02-20T08:05:00', 'seed-runtime'),
  ('mov-007-b', 'pres-007', 'ENTRADA', 300.0, 'lote-007-b', 'nodo-007-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-05-10T08:05:00', 'seed-runtime'),
  ('mov-008-a', 'pres-008', 'ENTRADA', 120.0, 'lote-008-a', 'nodo-008-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-03-01T09:05:00', 'seed-runtime'),
  ('mov-008-b', 'pres-008', 'ENTRADA', 180.0, 'lote-008-b', 'nodo-008-raiz', 'INGRESO_MERCADERIA', NULL, 'op-seed', '2026-06-10T09:05:00', 'seed-runtime');

INSERT OR IGNORE INTO valor_operacional (id, nodo_id, tipo, valor, moneda, condicion_cantidad_minima, vigencia_desde, vigencia_hasta, estado, creado_en, modificado_en) VALUES
  ('vo-001-raiz', 'nodo-001-raiz', 'VENTA_NORMAL', 18.50, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-002-raiz', 'nodo-002-raiz', 'VENTA_NORMAL', 22.00, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-003-raiz', 'nodo-003-raiz', 'VENTA_NORMAL', 28.00, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-004-raiz', 'nodo-004-raiz', 'VENTA_NORMAL', 42.00, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-005-raiz', 'nodo-005-raiz', 'VENTA_NORMAL', 24.00, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-006-raiz', 'nodo-006-raiz', 'VENTA_NORMAL', 55.00, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-007-raiz', 'nodo-007-raiz', 'VENTA_NORMAL', 12.00, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-008-raiz', 'nodo-008-raiz', 'VENTA_NORMAL', 68.00, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-001-frac', 'nodo-001-frac', 'VENTA_NORMAL',  0.20, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-003-frac', 'nodo-003-frac', 'VENTA_NORMAL',  2.50, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00'),
  ('vo-005-frac', 'nodo-005-frac', 'VENTA_NORMAL',  1.30, 'PEN', NULL, '2026-01-01', NULL, 'ACTIVO', '2026-01-10T08:00:00', '2026-01-10T08:00:00');

COMMIT;
