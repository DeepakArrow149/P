const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:9002';

async function testCRUDOperations() {
    console.log('🚀 Starting CRUD Operations Test...\n');
    
    // Test Line CRUD operations
    console.log('📝 Testing Line CRUD Operations:');
    
    // 1. CREATE - Test POST /api/lines
    const newLine = {
        lineCode: 'TEST-LINE-001',
        lineName: 'Test Line for CRUD',
        unitId: 'unit-001',
        lineType: 'Sewing',
        defaultCapacity: 50,
        notes: 'Test line created for API testing'
    };
    
    try {
        console.log('   Creating new line...');
        const createResponse = await fetch(`${BASE_URL}/api/lines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newLine)
        });
        
        if (createResponse.ok) {
            const createdLine = await createResponse.json();
            console.log('   ✅ CREATE successful:', createdLine.success);
            
            const lineId = createdLine.data?.id;
            if (lineId) {
                // 2. READ - Test GET /api/lines/:id
                console.log('   Reading created line...');
                const readResponse = await fetch(`${BASE_URL}/api/lines/${lineId}`);
                if (readResponse.ok) {
                    const readLine = await readResponse.json();
                    console.log('   ✅ READ successful:', readLine.success);
                } else {
                    console.log('   ❌ READ failed:', readResponse.status);
                }
                
                // 3. UPDATE - Test PUT /api/lines/:id
                console.log('   Updating line...');
                const updateData = {
                    lineName: 'Test Line Updated',
                    defaultCapacity: 75
                };
                
                const updateResponse = await fetch(`${BASE_URL}/api/lines/${lineId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                
                if (updateResponse.ok) {
                    const updatedLine = await updateResponse.json();
                    console.log('   ✅ UPDATE successful:', updatedLine.success);
                } else {
                    console.log('   ❌ UPDATE failed:', updateResponse.status);
                }
                
                // 4. DELETE - Test DELETE /api/lines/:id
                console.log('   Deleting line...');
                const deleteResponse = await fetch(`${BASE_URL}/api/lines/${lineId}`, {
                    method: 'DELETE'
                });
                
                if (deleteResponse.ok) {
                    const deleteResult = await deleteResponse.json();
                    console.log('   ✅ DELETE successful:', deleteResult.success);
                } else {
                    console.log('   ❌ DELETE failed:', deleteResponse.status);
                }
            }
        } else {
            console.log('   ❌ CREATE failed:', createResponse.status);
            const errorText = await createResponse.text();
            console.log('   Error:', errorText);
        }
    } catch (error) {
        console.log('   ❌ CRUD test error:', error.message);
    }
    
    // Test Buyer CRUD operations
    console.log('\n📝 Testing Buyer CRUD Operations:');
    
    const newBuyer = {
        buyerCode: 'TEST-B001',
        buyerName: 'Test Buyer for CRUD',
        contactPerson: 'Test Contact',
        email: 'test@testbuyer.com',
        phone: '+1-555-TEST',
        address: '123 Test Street',
        isActive: true,
        notes: 'Test buyer created for API testing'
    };
    
    try {
        console.log('   Creating new buyer...');
        const createResponse = await fetch(`${BASE_URL}/api/buyers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newBuyer)
        });
        
        if (createResponse.ok) {
            const createdBuyer = await createResponse.json();
            console.log('   ✅ CREATE successful:', createdBuyer.success);
            
            const buyerId = createdBuyer.data?.id;
            if (buyerId) {
                // Test READ
                console.log('   Reading created buyer...');
                const readResponse = await fetch(`${BASE_URL}/api/buyers/${buyerId}`);
                if (readResponse.ok) {
                    const readBuyer = await readResponse.json();
                    console.log('   ✅ READ successful:', readBuyer.success);
                } else {
                    console.log('   ❌ READ failed:', readResponse.status);
                }
                
                // Test UPDATE
                console.log('   Updating buyer...');
                const updateData = {
                    buyerName: 'Test Buyer Updated',
                    phone: '+1-555-UPDATED'
                };
                
                const updateResponse = await fetch(`${BASE_URL}/api/buyers/${buyerId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                
                if (updateResponse.ok) {
                    const updatedBuyer = await updateResponse.json();
                    console.log('   ✅ UPDATE successful:', updatedBuyer.success);
                } else {
                    console.log('   ❌ UPDATE failed:', updateResponse.status);
                }
                
                // Test DELETE
                console.log('   Deleting buyer...');
                const deleteResponse = await fetch(`${BASE_URL}/api/buyers/${buyerId}`, {
                    method: 'DELETE'
                });
                
                if (deleteResponse.ok) {
                    const deleteResult = await deleteResponse.json();
                    console.log('   ✅ DELETE successful:', deleteResult.success);
                } else {
                    console.log('   ❌ DELETE failed:', deleteResponse.status);
                }
            }
        } else {
            console.log('   ❌ CREATE failed:', createResponse.status);
            const errorText = await createResponse.text();
            console.log('   Error:', errorText);
        }
    } catch (error) {
        console.log('   ❌ CRUD test error:', error.message);
    }
    
    console.log('\n🎯 CRUD Operations test completed!');
}

testCRUDOperations().catch(console.error);
