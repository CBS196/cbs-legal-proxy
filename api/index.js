// Aquest és el codi per a la nostra funció de servidor proxy.
// VERSIÓ DE DEPURACIÓ: Afegeix més registres (logs) per veure cada pas.

export default async function handler(req, res) {
  console.log('--- Proxy function started ---');
  console.log('Request Method:', req.method);

  if (req.method !== 'POST') {
    console.log('Error: Method was not POST. Rejecting.');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const makeWebhookUrl = 'https://hook.eu2.make.com/xxrmycgfo15zba1sm6g64l9xyttf5f5v';
  console.log('Target Make.com URL:', makeWebhookUrl);

  try {
    const { queryText, intensityLevel, caseFiles } = req.query;
    console.log('Received query parameters:', req.query);

    const payload = {
      queryText: queryText,
      intensityLevel: parseInt(intensityLevel, 10),
      caseFiles: caseFiles,
    };
    console.log('Sending this payload to Make.com:', JSON.stringify(payload));

    const makeResponse = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Registrem l'estat de la resposta de Make.com, sigui quina sigui.
    console.log('Received response status from Make.com:', makeResponse.status);
    const responseBody = await makeResponse.text();
    console.log('Received response body from Make.com:', responseBody);

    if (!makeResponse.ok) {
      console.error('Make.com response was NOT OK. Forwarding error to GPT.');
      res.status(makeResponse.status).json({ error: 'Error from Make.com', details: responseBody });
      return;
    }

    console.log('Make.com response was OK. Sending success back to GPT.');
    res.status(200).json({ status: 'success', message: 'Query forwarded successfully', make_response: responseBody });

  } catch (error) {
    console.error('--- FATAL ERROR in proxy function ---:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
