const mysql = require('mysql2/promise');

async function insertOrdersWithMasterData() {
    console.log('🚀 Starting to insert 4 orders with master data references...');
    
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'root',
            password: '',
            database: 'planner_react',
        });

        console.log('✅ Connected to database successfully!');
        
        // First, get available buyers
        console.log('\n📋 Getting available master data...');
        const [buyers] = await connection.execute('SELECT id, code, name FROM `buyers` LIMIT 4');
        console.log(`Found ${buyers.length} buyers`);
        
        // Get available lines
        const [lines] = await connection.execute('SELECT id, lineCode, lineName FROM `lines` LIMIT 4');
        console.log(`Found ${lines.length} lines`);
        
        if (buyers.length === 0 || lines.length === 0) {
            console.log('❌ Insufficient master data. Need at least 1 buyer and 1 line.');
            await connection.end();
            return;
        }
        
        // Create 4 sample orders with proper references
        const orders = [
            {
                id: `order_${Date.now()}_1`,
                order_reference: 'ORD-2025-001',
                description: 'Spring Collection T-Shirts',
                product: 'Basic Cotton T-Shirt',
                customer: buyers[0].name,
                buyer: buyers[0].id,
                style_name: 'Classic Fit Tee',
                order_set: 'Spring 2025',
                sales_year: 2025,
                season: 'Spring',
                efficiency: 85.5,
                status: 'confirmed',
                color: '#FF6B6B',
                contract_quantity: 5000,
                order_date: new Date('2025-01-15'),
                launch_date: new Date('2025-03-01'),
                ship_date: new Date('2025-04-15'),
                deliver_to: 'New York Warehouse',
                method: 'FOB',
                general_notes: 'Rush order for spring launch',
                planning_notes: 'Allocate to high-efficiency line'
            },
            {
                id: `order_${Date.now()}_2`,
                order_reference: 'ORD-2025-002',
                description: 'Summer Polo Collection',
                product: 'Pique Polo Shirt',
                customer: buyers[1] ? buyers[1].name : buyers[0].name,
                buyer: buyers[1] ? buyers[1].id : buyers[0].id,
                style_name: 'Classic Polo',
                order_set: 'Summer 2025',
                sales_year: 2025,
                season: 'Summer',
                efficiency: 78.2,
                status: 'provisional',
                color: '#4ECDC4',
                contract_quantity: 3500,
                order_date: new Date('2025-02-01'),
                launch_date: new Date('2025-04-01'),
                ship_date: new Date('2025-05-30'),
                deliver_to: 'Los Angeles Distribution Center',
                method: 'CIF',
                general_notes: 'Quality focus - premium polo line',
                planning_notes: 'Requires specialized knitting line'
            },
            {
                id: `order_${Date.now()}_3`,
                order_reference: 'ORD-2025-003',
                description: 'Fall Hoodie Collection',
                product: 'Fleece Hoodie',
                customer: buyers[2] ? buyers[2].name : buyers[0].name,
                buyer: buyers[2] ? buyers[2].id : buyers[0].id,
                style_name: 'Urban Hoodie',
                order_set: 'Fall 2025',
                sales_year: 2025,
                season: 'Fall',
                efficiency: 72.8,
                status: 'unscheduled',
                color: '#95E1D3',
                contract_quantity: 2800,
                order_date: new Date('2025-03-10'),
                launch_date: new Date('2025-06-01'),
                ship_date: new Date('2025-08-15'),
                deliver_to: 'Chicago Hub',
                method: 'EXW',
                general_notes: 'Complex garment - allow extra time',
                planning_notes: 'Needs specialized equipment for hood attachment'
            },
            {
                id: `order_${Date.now()}_4`,
                order_reference: 'ORD-2025-004',
                description: 'Winter Jacket Collection',
                product: 'Padded Winter Jacket',
                customer: buyers[3] ? buyers[3].name : buyers[0].name,
                buyer: buyers[3] ? buyers[3].id : buyers[0].id,
                style_name: 'Arctic Pro Jacket',
                order_set: 'Winter 2025',
                sales_year: 2025,
                season: 'Winter',
                efficiency: 65.3,
                status: 'speculative',
                color: '#F38BA8',
                contract_quantity: 1500,
                order_date: new Date('2025-04-20'),
                launch_date: new Date('2025-08-01'),
                ship_date: new Date('2025-10-30'),
                deliver_to: 'Toronto Warehouse',
                method: 'DDU',
                general_notes: 'High-end product line - premium materials',
                planning_notes: 'Requires down filling and waterproof testing'
            }
        ];
        
        console.log('\n📝 Inserting orders...');
        
        for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            
            try {
                await connection.execute(`
                    INSERT INTO orders (
                        id, order_reference, description, product, customer, buyer,
                        style_name, order_set, sales_year, season, efficiency, status,
                        color, contract_quantity, order_date, launch_date, ship_date,
                        deliver_to, method, general_notes, planning_notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `, [
                    order.id, order.order_reference, order.description, order.product,
                    order.customer, order.buyer, order.style_name, order.order_set,
                    order.sales_year, order.season, order.efficiency, order.status,
                    order.color, order.contract_quantity, order.order_date,
                    order.launch_date, order.ship_date, order.deliver_to, order.method,
                    order.general_notes, order.planning_notes
                ]);
                
                console.log(`   ✅ Order ${i + 1}: ${order.order_reference} - ${order.description}`);
                console.log(`      Customer: ${order.customer}`);
                console.log(`      Quantity: ${order.contract_quantity}`);
                console.log(`      Status: ${order.status}`);
                console.log(`      Ship Date: ${order.ship_date.toISOString().split('T')[0]}`);
                
            } catch (insertError) {
                console.log(`   ❌ Failed to insert order ${i + 1}: ${insertError.message}`);
            }
        }
        
        // Verify insertion
        console.log('\n🔍 Verifying inserted orders...');
        const [insertedOrders] = await connection.execute(`
            SELECT o.order_reference, o.description, o.customer, b.name as buyer_name, o.status, o.contract_quantity
            FROM orders o
            LEFT JOIN buyers b ON o.buyer = b.id
            WHERE o.order_reference LIKE 'ORD-2025-%'
            ORDER BY o.order_reference
        `);
        
        console.log(`\n📊 Successfully inserted ${insertedOrders.length} orders:`);
        insertedOrders.forEach((order, index) => {
            console.log(`   ${index + 1}. ${order.order_reference} - ${order.description}`);
            console.log(`      Buyer: ${order.buyer_name || 'N/A'}`);
            console.log(`      Quantity: ${order.contract_quantity}`);
            console.log(`      Status: ${order.status}`);
        });
        
        await connection.end();
        console.log('\n🎉 Order insertion completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

insertOrdersWithMasterData();
