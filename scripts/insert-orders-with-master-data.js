// Script to insert 4 orders with proper master data references for planning board
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function insertOrdersWithMasterData() {
    console.log('🚀 Inserting 4 Orders with Master Data References for Planning Board...\n');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'planner_react',
        });

        console.log('✅ Connected to database successfully!');
        
        // First, get available buyers and lines for proper referencing
        console.log('\n📋 Fetching master data for references...');
        
        const [buyers] = await connection.execute('SELECT id, code, name FROM buyers LIMIT 10');
        const [lines] = await connection.execute('SELECT id, lineCode, lineName FROM lines LIMIT 10');
        
        console.log(`   👥 Available buyers: ${buyers.length}`);
        console.log(`   🏭 Available lines: ${lines.length}`);
        
        // Define 4 new orders with proper master data references
        const newOrders = [
            {
                id: uuidv4(),
                order_reference: 'ORD-2025-SPRING-001',
                description: 'Spring Collection T-Shirts for Global Market - Planning Board Integration',
                product: 'Premium Cotton T-Shirt',
                customer: buyers[0]?.name || 'Global Fashion Inc.',
                buyer: buyers[0]?.name || 'Global Fashion Inc.',
                style_name: 'Spring Cotton Classic',
                timetable: 'Q2 2025',
                order_set: 'Spring-Collection-2025',
                sales_year: 2025,
                season: 'Spring',
                efficiency: 88.50,
                user_status: 'Active',
                learning_curve_id: 'premium-apparel-curve',
                tna_template: 'premium-garment-template',
                status: 'confirmed',
                color: '#4CAF50',
                is_completed: 0,
                order_date: new Date('2025-06-07'),
                received_date: new Date('2025-06-07'),
                launch_date: new Date('2025-07-15'),
                ship_date: new Date('2025-09-30'),
                contract_quantity: 8000,
                distribute_from: 'Main Production Facility',
                deliver_to: 'Global Distribution Hub',
                method: 'Sea Freight',
                plan_in_group: 'Premium-Group',
                use_route: 'Global-Route-A',
                delivered_quantity: 0,
                general_notes: 'High priority spring collection for planning board scheduling',
                assignedLine: lines[0]?.lineCode || 'LINE-001'
            },
            {
                id: uuidv4(),
                order_reference: 'ORD-2025-SUMMER-002',
                description: 'Summer Polo Collection for European Distribution - Planning Board Ready',
                product: 'Performance Polo Shirt',
                customer: buyers[1]?.name || 'European Styles Ltd.',
                buyer: buyers[1]?.name || 'European Styles Ltd.',
                style_name: 'Summer Performance Polo',
                timetable: 'Q3 2025',
                order_set: 'Summer-Performance-2025',
                sales_year: 2025,
                season: 'Summer',
                efficiency: 92.00,
                user_status: 'Active',
                learning_curve_id: 'performance-apparel-curve',
                tna_template: 'performance-garment-template',
                status: 'provisional',
                color: '#2196F3',
                is_completed: 0,
                order_date: new Date('2025-06-07'),
                received_date: new Date('2025-06-07'),
                launch_date: new Date('2025-08-01'),
                ship_date: new Date('2025-10-15'),
                contract_quantity: 12000,
                distribute_from: 'European Production Center',
                deliver_to: 'European Regional Centers',
                method: 'Road Transport',
                plan_in_group: 'Performance-Group',
                use_route: 'EU-Route-Premium',
                delivered_quantity: 0,
                general_notes: 'Critical summer collection requiring optimized planning board allocation',
                assignedLine: lines[1]?.lineCode || 'LINE-002'
            },
            {
                id: uuidv4(),
                order_reference: 'ORD-2025-FALL-003',
                description: 'Fall Hoodie Collection for Asian Market - Planning Board Optimized',
                product: 'Premium Hoodie',
                customer: buyers[2]?.name || 'Asian Apparel Co.',
                buyer: buyers[2]?.name || 'Asian Apparel Co.',
                style_name: 'Fall Premium Hoodie',
                timetable: 'Q4 2025',
                order_set: 'Fall-Premium-2025',
                sales_year: 2025,
                season: 'Fall',
                efficiency: 85.75,
                user_status: 'Active',
                learning_curve_id: 'complex-apparel-curve',
                tna_template: 'complex-garment-template',
                status: 'confirmed',
                color: '#FF9800',
                is_completed: 0,
                order_date: new Date('2025-06-07'),
                received_date: new Date('2025-06-07'),
                launch_date: new Date('2025-09-01'),
                ship_date: new Date('2025-11-30'),
                contract_quantity: 6500,
                distribute_from: 'Asian Production Hub',
                deliver_to: 'Asian Distribution Network',
                method: 'Air Freight',
                plan_in_group: 'Complex-Group',
                use_route: 'Asia-Route-Express',
                delivered_quantity: 0,
                general_notes: 'Fall collection requiring advanced planning board scheduling due to complexity',
                assignedLine: lines[2]?.lineCode || 'LINE-003'
            },
            {
                id: uuidv4(),
                order_reference: 'ORD-2025-WINTER-004',
                description: 'Winter Jacket Collection for Premium Market - Planning Board Integration',
                product: 'Premium Winter Jacket',
                customer: buyers[3]?.name || 'Fast Fashion Group',
                buyer: buyers[3]?.name || 'Fast Fashion Group',
                style_name: 'Winter Premium Jacket',
                timetable: 'Q1 2026',
                order_set: 'Winter-Premium-2026',
                sales_year: 2026,
                season: 'Winter',
                efficiency: 78.25,
                user_status: 'Active',
                learning_curve_id: 'premium-complex-curve',
                tna_template: 'premium-complex-template',
                status: 'speculative',
                color: '#9C27B0',
                is_completed: 0,
                order_date: new Date('2025-06-07'),
                received_date: new Date('2025-06-07'),
                launch_date: new Date('2025-10-15'),
                ship_date: new Date('2026-01-31'),
                contract_quantity: 4200,
                distribute_from: 'Premium Production Facility',
                deliver_to: 'Premium Retail Network',
                method: 'Express Delivery',
                plan_in_group: 'Premium-Complex-Group',
                use_route: 'Premium-Route-Global',
                delivered_quantity: 0,
                general_notes: 'Premium winter collection requiring specialized planning board resource allocation',
                assignedLine: lines[3]?.lineCode || 'LINE-004'
            }
        ];
        
        console.log('\n📦 Inserting orders into database...');
        
        // Insert each order
        for (let i = 0; i < newOrders.length; i++) {
            const order = newOrders[i];
            
            console.log(`\n   📋 Inserting Order ${i + 1}: ${order.order_reference}`);
            console.log(`      Product: ${order.product}`);
            console.log(`      Customer: ${order.customer}`);
            console.log(`      Quantity: ${order.contract_quantity}`);
            console.log(`      Assigned Line: ${order.assignedLine}`);
            console.log(`      Status: ${order.status}`);
            
            const insertQuery = `
                INSERT INTO orders (
                    id, order_reference, description, product, customer, buyer, style_name,
                    timetable, order_set, sales_year, season, efficiency, user_status,
                    learning_curve_id, tna_template, status, color, is_completed,
                    order_date, received_date, launch_date, ship_date, contract_quantity,
                    distribute_from, deliver_to, method, plan_in_group, use_route,
                    delivered_quantity, general_notes, assignedLine, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `;
            
            const values = [
                order.id, order.order_reference, order.description, order.product,
                order.customer, order.buyer, order.style_name, order.timetable,
                order.order_set, order.sales_year, order.season, order.efficiency,
                order.user_status, order.learning_curve_id, order.tna_template,
                order.status, order.color, order.is_completed, order.order_date,
                order.received_date, order.launch_date, order.ship_date,
                order.contract_quantity, order.distribute_from, order.deliver_to,
                order.method, order.plan_in_group, order.use_route,
                order.delivered_quantity, order.general_notes, order.assignedLine
            ];
            
            try {
                await connection.execute(insertQuery, values);
                console.log(`      ✅ Successfully inserted!`);
            } catch (error) {
                console.log(`      ❌ Failed to insert: ${error.message}`);
            }
        }
        
        // Verify the insertions
        console.log('\n🔍 Verifying inserted orders...');
        const [verifyResult] = await connection.execute(`
            SELECT order_reference, product, customer, assignedLine, status, contract_quantity 
            FROM orders 
            WHERE order_reference IN (?, ?, ?, ?)
            ORDER BY order_reference
        `, [
            'ORD-2025-SPRING-001',
            'ORD-2025-SUMMER-002', 
            'ORD-2025-FALL-003',
            'ORD-2025-WINTER-004'
        ]);
        
        console.log(`\n📊 Verification Results: ${verifyResult.length} orders found`);
        verifyResult.forEach((order, index) => {
            console.log(`   ${index + 1}. ${order.order_reference}`);
            console.log(`      Product: ${order.product}`);
            console.log(`      Customer: ${order.customer}`);
            console.log(`      Line: ${order.assignedLine}`);
            console.log(`      Status: ${order.status}`);
            console.log(`      Quantity: ${order.contract_quantity}`);
        });
        
        // Get final count
        const [finalCount] = await connection.execute('SELECT COUNT(*) as total FROM orders');
        console.log(`\n📈 Total orders in database: ${finalCount[0].total}`);
        
        await connection.end();
        console.log('\n✅ Order insertion completed successfully!');
        console.log('🎯 Planning Board is now ready with updated master data references!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code) {
            console.error(`   Code: ${error.code}`);
        }
    }
}

// Run the insertion
insertOrdersWithMasterData();
