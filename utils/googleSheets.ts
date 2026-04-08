// WARNING: This is a client-side implementation for a prototype.
// Storing credentials and passwords in Google Sheets is NOT secure.
// Ensure your Google Sheet is private and only accessible by you.

// WARNING: This is a client-side implementation for a prototype.
// Storing credentials and passwords in Google Sheets is NOT secure.
// Ensure your Google Sheet is private and only accessible by you.

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxwGoYVS-5C-UnYnpJk4Mi7r-5l2urfXmbXnEhD0WFTjjzbYAHorLEnOy7X6vjKVSKK/exec';

// استخدام JSONP للقراءة لتجاوز CORS
export const readFromSheet = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };

    const script = document.createElement('script');
    script.src = `${WEB_APP_URL}?callback=${callbackName}`;
    script.onerror = () => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      reject(new Error('Failed to fetch (JSONP)'));
    };
    document.body.appendChild(script);
  });
};

// الإرسال عبر GET لتجنب CORS
export const writeToSheet = async (sheetName: string, data: any[]) => {
  // استخدام JSONP أيضاً للإرسال لضمان عدم وجود CORS
  return new Promise((resolve, reject) => {
    const callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    (window as any)[callbackName] = (data: any) => {
      delete (window as any)[callbackName];
      document.body.removeChild(script);
      resolve(data);
    };
    const script = document.createElement('script');
    script.src = `${WEB_APP_URL}?key=${sheetName}&data=${encodeURIComponent(JSON.stringify(data))}&callback=${callbackName}`;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};
