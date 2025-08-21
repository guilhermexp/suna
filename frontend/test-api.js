// Test script to verify API endpoints are working

const API_URL = 'http://localhost:8000/api';

const endpoints = [
  '/templates/marketplace',
  '/templates/my',
  '/secure-mcp/credentials',
  '/knowledge-base',
  '/triggers/providers'
];

async function testEndpoint(endpoint) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`${endpoint}: ${response.status} ${response.statusText}`);
    return { endpoint, status: response.status };
  } catch (error) {
    console.log(`${endpoint}: ERROR - ${error.message}`);
    return { endpoint, status: 'error', error: error.message };
  }
}

async function testAll() {
  console.log('Testing API endpoints...');
  console.log('API_URL:', API_URL);
  console.log('---');
  
  const results = await Promise.all(endpoints.map(testEndpoint));
  
  console.log('\n--- Summary ---');
  const successful = results.filter(r => r.status === 200).length;
  const failed = results.filter(r => r.status !== 200).length;
  
  console.log(`Successful: ${successful}/${endpoints.length}`);
  console.log(`Failed: ${failed}/${endpoints.length}`);
  
  if (failed > 0) {
    console.log('\nFailed endpoints:');
    results.filter(r => r.status !== 200).forEach(r => {
      console.log(`  ${r.endpoint}: ${r.status}`);
    });
  }
}

testAll();