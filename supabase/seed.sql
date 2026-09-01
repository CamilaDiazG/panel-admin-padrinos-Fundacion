-- Datos completamente ficticios para desarrollo. Ejecutar después de crear un usuario.
insert into public.padrinos (
  tipo, nombres, apellido_paterno, apellido_materno, razon_social, rfc,
  contacto_responsable, email, telefono, canal_preferido, estado, municipio,
  codigo_postal, fecha_alta, aportacion, periodicidad, metodo_pago, origen,
  proximo_seguimiento, estatus
) values
('persona', 'Mariana', 'López', 'Ruiz', '', 'LORM880515AB1', '', 'mariana@example.com', '3312345678', 'whatsapp', 'Jalisco', 'Zapopan', '45019', '2026-01-12', 800, 'mensual', 'transferencia', 'recomendacion', '2026-09-12', 'activo'),
('empresa', '', '', '', 'Impulso Tapatío, S.A. de C.V.', 'ITA190101XY2', 'Carlos Rivera', 'donativos@impulso.example', '3334567890', 'correo', 'Jalisco', 'Guadalajara', '44100', '2026-02-08', 12000, 'trimestral', 'deposito', 'empresa', '2026-10-01', 'activo'),
('persona', 'Eduardo', 'Santos', 'Mora', '', '', '', 'eduardo@example.com', '3311122233', 'llamada', 'Jalisco', 'Tlaquepaque', '45500', '2026-03-17', 1000, 'mensual', 'tarjeta', 'evento', '2026-09-20', 'pendiente');
