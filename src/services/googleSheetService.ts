const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxsw_c28NuIM__rmgL4jkoGmgCBSOrXSP_hOwpW8FsjnZ9Yz5qoCMdr98C1hwFtCcuV6A/exec';

export async function logDataToSheet(sheetName: string, data: any) {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sheetName, data }),
    });
    return { success: true };
  } catch (error) {
    console.error('Error logging to Google Sheet:', error);
    return { success: false, error };
  }
}

export async function testConnection() {
  try {
    // For testConnection, we might not be able to read the response if using no-cors
    // But if it doesn't throw, we assume it's reachable.
    await fetch(GOOGLE_SHEET_URL, {
      method: 'GET',
      mode: 'no-cors',
    });
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

export async function getUsers(): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    // Create a global function to receive the data
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    // Add a script tag to request the data
    const script = document.createElement('script');
    script.src = `${GOOGLE_SHEET_URL}?action=getUsers&callback=${callbackName}`;
    script.onerror = (err) => {
      document.body.removeChild(script);
      reject(err);
    };
    document.body.appendChild(script);
  });
}

export async function deleteUser(username: string) {
  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'deleteUser', username }),
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error };
  }
}
