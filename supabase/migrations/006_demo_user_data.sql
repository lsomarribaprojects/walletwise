-- ============================================================================
-- Migration: Demo User with Complete Sample Data
-- Description: Creates a demo user with realistic financial data
-- Author: Claude AI
-- Date: 2026-01-12
-- ============================================================================
--
-- =====================================================
-- CREDENCIALES DEL USUARIO DEMO:
-- Email: demo@walletwise.app
-- Password: Demo2026!
-- =====================================================
--
-- INSTRUCCIONES:
-- Ejecuta este script en el SQL Editor de Supabase
-- El script creara el usuario automaticamente si no existe
-- ============================================================================

DO $$
DECLARE
    demo_user_id UUID;
BEGIN
    -- Buscar si ya existe el usuario demo
    SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@walletwise.app';

    -- Si no existe, crearlo usando la extension pgcrypto para hash de password
    IF demo_user_id IS NULL THEN
        -- Generar UUID para el nuevo usuario
        demo_user_id := gen_random_uuid();

        -- Insertar usuario en auth.users
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role,
            aud,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            demo_user_id,
            '00000000-0000-0000-0000-000000000000',
            'demo@walletwise.app',
            crypt('Demo2026!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            false,
            'authenticated',
            'authenticated',
            '',
            '',
            '',
            ''
        );

        -- Insertar identidad en auth.identities
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            provider_id,
            created_at,
            updated_at,
            last_sign_in_at
        ) VALUES (
            gen_random_uuid(),
            demo_user_id,
            jsonb_build_object('sub', demo_user_id::text, 'email', 'demo@walletwise.app'),
            'email',
            demo_user_id::text,
            NOW(),
            NOW(),
            NOW()
        );

        RAISE NOTICE 'Usuario demo creado exitosamente!';
    ELSE
        RAISE NOTICE 'Usuario demo ya existe, actualizando datos...';
    END IF;

    -- Limpiar datos existentes del usuario demo (por si se ejecuta multiples veces)
    DELETE FROM transacciones WHERE user_id = demo_user_id;
    DELETE FROM gastos_mensuales WHERE user_id = demo_user_id;
    DELETE FROM gastos_anuales WHERE user_id = demo_user_id;
    DELETE FROM credit_cards WHERE user_id = demo_user_id;
    DELETE FROM cuentas WHERE user_id = demo_user_id;

    -- ========================================================================
    -- CUENTAS BANCARIAS (usando tipos validos: debito, credito, efectivo)
    -- ========================================================================
    INSERT INTO cuentas (user_id, nombre, tipo, balance_inicial, color, activa) VALUES
    (demo_user_id, 'Chase Checking', 'debito', 8500.00, '#3B82F6', true),
    (demo_user_id, 'Ally Savings', 'debito', 15000.00, '#10B981', true),
    (demo_user_id, 'Cash Wallet', 'efectivo', 450.00, '#F59E0B', true),
    (demo_user_id, 'Fidelity Investments', 'debito', 45000.00, '#9333EA', true),
    (demo_user_id, 'Emergency Fund', 'debito', 12000.00, '#06B6D4', true);

    -- ========================================================================
    -- TARJETAS DE CREDITO (tabla credit_cards)
    -- ========================================================================
    INSERT INTO credit_cards (user_id, nombre, banco, ultimos_digitos, tasa_interes_anual, limite_credito, saldo_actual, fecha_corte, fecha_pago, pago_minimo, color, activa) VALUES
    -- Tarjeta principal con saldo moderado
    (demo_user_id, 'Chase Sapphire Preferred', 'Chase', '4521', 21.49, 12000, 3200, 15, 23, 96, '#3B82F6', true),
    -- Tarjeta con alto APR y saldo
    (demo_user_id, 'Capital One Quicksilver', 'Capital One', '7890', 26.99, 8000, 2800, 8, 16, 84, '#EF4444', true),
    -- Tarjeta casi al limite (para mostrar alerta de utilizacion > 80%)
    (demo_user_id, 'Discover it', 'Discover', '3456', 18.74, 5000, 4100, 22, 1, 123, '#F59E0B', true),
    -- Tarjeta con bajo saldo (casi pagada)
    (demo_user_id, 'Amex Blue Cash', 'American Express', '1234', 19.99, 10000, 450, 5, 12, 25, '#9333EA', true),
    -- Tarjeta sin deuda (para mostrar variedad)
    (demo_user_id, 'Citi Double Cash', 'Citibank', '9876', 17.99, 15000, 0, 18, 25, 0, '#06B6D4', true);

    -- ========================================================================
    -- GASTOS MENSUALES RECURRENTES
    -- ========================================================================
    INSERT INTO gastos_mensuales (user_id, nombre_app, categoria, dia_de_cobro, monto, activo, cuenta) VALUES
    -- Vivienda
    (demo_user_id, 'Rent', 'rent', 1, 1850.00, true, 'Chase Checking'),
    (demo_user_id, 'Electric Bill', 'services', 15, 120.00, true, 'Chase Checking'),
    (demo_user_id, 'Water Bill', 'services', 20, 45.00, true, 'Chase Checking'),
    (demo_user_id, 'Internet (Xfinity)', 'services', 8, 79.99, true, 'Chase Checking'),
    (demo_user_id, 'Gas Bill', 'services', 18, 65.00, true, 'Chase Checking'),

    -- Suscripciones de entretenimiento
    (demo_user_id, 'Netflix', 'entertainment', 12, 15.49, true, 'Chase Sapphire Preferred'),
    (demo_user_id, 'Spotify Family', 'entertainment', 15, 16.99, true, 'Chase Sapphire Preferred'),
    (demo_user_id, 'Disney+', 'entertainment', 22, 13.99, true, 'Chase Sapphire Preferred'),
    (demo_user_id, 'HBO Max', 'entertainment', 5, 15.99, true, 'Chase Sapphire Preferred'),
    (demo_user_id, 'YouTube Premium', 'entertainment', 10, 13.99, true, 'Chase Sapphire Preferred'),
    (demo_user_id, 'Amazon Prime', 'other', 7, 14.99, true, 'Capital One Quicksilver'),
    (demo_user_id, 'Apple iCloud', 'software', 28, 2.99, true, 'Amex Blue Cash'),

    -- Salud y Fitness
    (demo_user_id, 'Planet Fitness', 'other', 1, 24.99, true, 'Chase Checking'),
    (demo_user_id, 'Health Insurance', 'other', 1, 350.00, true, 'Chase Checking'),

    -- Transporte
    (demo_user_id, 'Car Payment', 'transport', 5, 425.00, true, 'Chase Checking'),
    (demo_user_id, 'Car Insurance', 'transport', 15, 145.00, true, 'Chase Checking'),

    -- Software/Productividad
    (demo_user_id, 'Microsoft 365', 'software', 20, 9.99, true, 'Amex Blue Cash'),
    (demo_user_id, 'Notion Pro', 'software', 25, 10.00, true, 'Amex Blue Cash'),

    -- Telefono
    (demo_user_id, 'T-Mobile', 'services', 12, 85.00, true, 'Chase Checking');

    -- ========================================================================
    -- GASTOS ANUALES
    -- ========================================================================
    INSERT INTO gastos_anuales (user_id, nombre_servicio, categoria, mes_de_cobro, dia_de_cobro, monto, activo, cuenta) VALUES
    (demo_user_id, 'Amazon Prime Annual', 'other', 3, 15, 139.00, true, 'Capital One Quicksilver'),
    (demo_user_id, 'Costco Membership', 'other', 6, 1, 65.00, true, 'Chase Checking'),
    (demo_user_id, 'AAA Membership', 'transport', 4, 10, 89.00, true, 'Chase Checking'),
    (demo_user_id, 'Domain Renewal', 'software', 2, 22, 15.00, true, 'Amex Blue Cash'),
    (demo_user_id, 'Annual Checkup', 'other', 1, 15, 150.00, true, 'Chase Checking'),
    (demo_user_id, 'Car Registration', 'transport', 8, 1, 125.00, true, 'Chase Checking'),
    (demo_user_id, 'Tax Software', 'software', 3, 1, 79.99, true, 'Amex Blue Cash');

    -- ========================================================================
    -- TRANSACCIONES DEL MES ACTUAL (Enero 2026)
    -- ========================================================================

    -- Ingresos
    INSERT INTO transacciones (user_id, tipo, monto, categoria, descripcion, fecha_hora, cuenta) VALUES
    -- Salario quincenal
    (demo_user_id, 'ingreso', 3250.00, 'payroll', 'Bi-weekly Paycheck', '2026-01-03 09:00:00', 'Chase Checking'),
    (demo_user_id, 'ingreso', 3250.00, 'payroll', 'Bi-weekly Paycheck', '2026-01-17 09:00:00', 'Chase Checking'),
    -- Freelance
    (demo_user_id, 'ingreso', 850.00, 'other', 'Web Design Project - Client ABC', '2026-01-08 14:30:00', 'Chase Checking'),
    -- Dividendos
    (demo_user_id, 'ingreso', 125.50, 'other', 'Q4 Dividends - Fidelity', '2026-01-05 10:00:00', 'Fidelity Investments'),
    -- Reembolso
    (demo_user_id, 'ingreso', 45.00, 'other', 'Refund from Amazon', '2026-01-10 16:00:00', 'Capital One Quicksilver');

    -- Gastos Enero 2026
    INSERT INTO transacciones (user_id, tipo, monto, categoria, descripcion, fecha_hora, cuenta) VALUES
    -- Vivienda (ya cobrado)
    (demo_user_id, 'gasto', 1850.00, 'rent', 'January Rent', '2026-01-01 08:00:00', 'Chase Checking'),

    -- Comida y Restaurantes
    (demo_user_id, 'gasto', 125.43, 'food', 'Whole Foods - Weekly Groceries', '2026-01-02 11:30:00', 'Chase Sapphire Preferred'),
    (demo_user_id, 'gasto', 42.50, 'food', 'Chipotle - Lunch', '2026-01-04 12:45:00', 'Chase Sapphire Preferred'),
    (demo_user_id, 'gasto', 89.99, 'food', 'Costco - Groceries', '2026-01-06 15:20:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 28.75, 'food', 'Starbucks', '2026-01-07 08:15:00', 'Chase Sapphire Preferred'),
    (demo_user_id, 'gasto', 156.00, 'food', 'Trader Joes - Weekly', '2026-01-09 14:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 65.00, 'entertainment', 'Dinner Date - The Cheesecake Factory', '2026-01-11 19:30:00', 'Discover it'),

    -- Transporte
    (demo_user_id, 'gasto', 48.50, 'transport', 'Gas - Shell', '2026-01-03 17:00:00', 'Capital One Quicksilver'),
    (demo_user_id, 'gasto', 52.00, 'transport', 'Gas - Chevron', '2026-01-10 16:30:00', 'Capital One Quicksilver'),
    (demo_user_id, 'gasto', 15.00, 'transport', 'Parking Downtown', '2026-01-08 09:00:00', 'Cash Wallet'),

    -- Salud
    (demo_user_id, 'gasto', 350.00, 'other', 'Health Insurance Premium', '2026-01-01 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 24.99, 'other', 'Planet Fitness', '2026-01-01 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 35.00, 'other', 'CVS Pharmacy', '2026-01-05 10:00:00', 'Chase Checking'),

    -- Entretenimiento
    (demo_user_id, 'gasto', 15.49, 'entertainment', 'Netflix', '2026-01-12 00:00:00', 'Chase Sapphire Preferred'),
    (demo_user_id, 'gasto', 75.00, 'entertainment', 'Concert Tickets', '2026-01-09 20:00:00', 'Discover it'),
    (demo_user_id, 'gasto', 14.99, 'entertainment', 'Movie Theater', '2026-01-07 19:00:00', 'Cash Wallet'),

    -- Shopping
    (demo_user_id, 'gasto', 89.00, 'other', 'Amazon - Household Items', '2026-01-04 14:00:00', 'Capital One Quicksilver'),
    (demo_user_id, 'gasto', 149.99, 'other', 'Target - Home Decor', '2026-01-06 16:00:00', 'Discover it'),
    (demo_user_id, 'gasto', 65.00, 'other', 'Clothing - H&M', '2026-01-11 13:00:00', 'Discover it'),

    -- Servicios
    (demo_user_id, 'gasto', 79.99, 'other', 'Xfinity Internet', '2026-01-08 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 85.00, 'other', 'T-Mobile', '2026-01-12 00:00:00', 'Chase Checking'),

    -- Software
    (demo_user_id, 'gasto', 9.99, 'software', 'Microsoft 365', '2026-01-05 00:00:00', 'Amex Blue Cash'),

    -- Car Payment
    (demo_user_id, 'gasto', 425.00, 'transport', 'Car Payment - Honda', '2026-01-05 00:00:00', 'Chase Checking');

    -- Transferencias
    INSERT INTO transacciones (user_id, tipo, monto, categoria, descripcion, fecha_hora, cuenta, cuenta_destino) VALUES
    (demo_user_id, 'transferencia', 500.00, 'other', 'Monthly Savings Transfer', '2026-01-03 10:00:00', 'Chase Checking', 'Ally Savings'),
    (demo_user_id, 'transferencia', 200.00, 'other', 'Emergency Fund Contribution', '2026-01-17 10:00:00', 'Chase Checking', 'Emergency Fund'),
    (demo_user_id, 'transferencia', 100.00, 'other', 'Cash Withdrawal', '2026-01-06 12:00:00', 'Chase Checking', 'Cash Wallet');

    -- ========================================================================
    -- TRANSACCIONES DE DICIEMBRE 2025 (para mostrar tendencias)
    -- ========================================================================
    INSERT INTO transacciones (user_id, tipo, monto, categoria, descripcion, fecha_hora, cuenta) VALUES
    -- Ingresos Diciembre
    (demo_user_id, 'ingreso', 3250.00, 'payroll', 'Bi-weekly Paycheck', '2025-12-05 09:00:00', 'Chase Checking'),
    (demo_user_id, 'ingreso', 3250.00, 'payroll', 'Bi-weekly Paycheck', '2025-12-19 09:00:00', 'Chase Checking'),
    (demo_user_id, 'ingreso', 2500.00, 'other', 'Year-end Bonus', '2025-12-20 09:00:00', 'Chase Checking'),
    (demo_user_id, 'ingreso', 450.00, 'other', 'Logo Design Project', '2025-12-10 14:00:00', 'Chase Checking'),

    -- Gastos Diciembre (holiday spending)
    (demo_user_id, 'gasto', 1850.00, 'rent', 'December Rent', '2025-12-01 08:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 425.00, 'transport', 'Car Payment', '2025-12-05 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 350.00, 'other', 'Health Insurance', '2025-12-01 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 450.00, 'other', 'Holiday Gifts', '2025-12-15 14:00:00', 'Discover it'),
    (demo_user_id, 'gasto', 320.00, 'other', 'More Holiday Gifts', '2025-12-18 11:00:00', 'Capital One Quicksilver'),
    (demo_user_id, 'gasto', 189.00, 'food', 'Holiday Dinner Party Groceries', '2025-12-23 10:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 95.00, 'entertainment', 'Holiday Party', '2025-12-24 19:00:00', 'Chase Sapphire Preferred'),
    (demo_user_id, 'gasto', 250.00, 'food', 'Christmas Dinner - Restaurant', '2025-12-25 18:00:00', 'Discover it'),
    (demo_user_id, 'gasto', 85.00, 'other', 'After-Christmas Sale', '2025-12-26 12:00:00', 'Capital One Quicksilver'),
    (demo_user_id, 'gasto', 145.00, 'entertainment', 'New Years Eve Party Supplies', '2025-12-30 15:00:00', 'Discover it'),
    (demo_user_id, 'gasto', 79.99, 'other', 'Xfinity Internet', '2025-12-08 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 85.00, 'other', 'T-Mobile', '2025-12-12 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 120.00, 'other', 'Electric Bill', '2025-12-15 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 180.00, 'food', 'Weekly Groceries', '2025-12-05 11:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 165.00, 'food', 'Weekly Groceries', '2025-12-12 11:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 55.00, 'transport', 'Gas', '2025-12-08 16:00:00', 'Capital One Quicksilver'),
    (demo_user_id, 'gasto', 60.00, 'transport', 'Gas', '2025-12-22 16:00:00', 'Capital One Quicksilver');

    -- ========================================================================
    -- TRANSACCIONES DE NOVIEMBRE 2025 (para mostrar mas historial)
    -- ========================================================================
    INSERT INTO transacciones (user_id, tipo, monto, categoria, descripcion, fecha_hora, cuenta) VALUES
    -- Ingresos Noviembre
    (demo_user_id, 'ingreso', 3250.00, 'payroll', 'Bi-weekly Paycheck', '2025-11-07 09:00:00', 'Chase Checking'),
    (demo_user_id, 'ingreso', 3250.00, 'payroll', 'Bi-weekly Paycheck', '2025-11-21 09:00:00', 'Chase Checking'),
    (demo_user_id, 'ingreso', 600.00, 'other', 'Website Maintenance', '2025-11-15 14:00:00', 'Chase Checking'),

    -- Gastos Noviembre
    (demo_user_id, 'gasto', 1850.00, 'rent', 'November Rent', '2025-11-01 08:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 425.00, 'transport', 'Car Payment', '2025-11-05 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 350.00, 'other', 'Health Insurance', '2025-11-01 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 200.00, 'food', 'Thanksgiving Groceries', '2025-11-25 10:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 150.00, 'food', 'Weekly Groceries', '2025-11-05 11:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 160.00, 'food', 'Weekly Groceries', '2025-11-12 11:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 145.00, 'food', 'Weekly Groceries', '2025-11-19 11:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 79.99, 'other', 'Xfinity Internet', '2025-11-08 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 85.00, 'other', 'T-Mobile', '2025-11-12 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 95.00, 'other', 'Electric Bill', '2025-11-15 00:00:00', 'Chase Checking'),
    (demo_user_id, 'gasto', 89.00, 'other', 'Black Friday - Electronics', '2025-11-28 06:00:00', 'Discover it'),
    (demo_user_id, 'gasto', 120.00, 'other', 'Black Friday - Clothes', '2025-11-28 10:00:00', 'Capital One Quicksilver'),
    (demo_user_id, 'gasto', 48.00, 'transport', 'Gas', '2025-11-10 16:00:00', 'Capital One Quicksilver'),
    (demo_user_id, 'gasto', 52.00, 'transport', 'Gas', '2025-11-24 16:00:00', 'Capital One Quicksilver');

    RAISE NOTICE '========================================';
    RAISE NOTICE 'DATOS DEMO CREADOS EXITOSAMENTE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Email: demo@walletwise.app';
    RAISE NOTICE 'Password: Demo2026!';
    RAISE NOTICE '';
    RAISE NOTICE 'Datos creados:';
    RAISE NOTICE '- 5 cuentas bancarias';
    RAISE NOTICE '- 5 tarjetas de credito (con deuda realista)';
    RAISE NOTICE '- 19 gastos mensuales recurrentes';
    RAISE NOTICE '- 7 gastos anuales';
    RAISE NOTICE '- 60+ transacciones (Nov 2025 - Ene 2026)';
    RAISE NOTICE '========================================';

END $$;
