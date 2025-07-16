// Aquest és el codi per a la nostra funció de servidor proxy.
// S'executarà a Vercel i actuarà com un pont entre el GPT i Make.com.

export default async function handler(req, res) {
  // 1. Verifiquem que la petició sigui de tipus POST, com envia l'Acció del GPT.
  // Si no ho és, retornem un error.
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // 2. Definim la URL del nostre webhook REAL de Make.com.
  // AQUESTA ÉS LA URL ORIGINAL QUE FALLAVA DES DEL GPT.
  const makeWebhookUrl = 'https://hook.eu2.make.com/i1xd18orqw0yalhnevg1rtxa65mbqpir';

  try {
    // 3. Extraiem els paràmetres que ens envia el GPT a la URL.
    // L'Acció del GPT els envia com a "query parameters".
    const { queryText, intensityLevel, caseFiles } = req.query;

    // 4. Construïm el cos (body) de la nova petició que enviarem a Make.com.
    // Make.com espera un objecte JSON.
    const payload = {
      queryText: queryText,
      intensityLevel: parseInt(intensityLevel, 10), // Assegurem que sigui un número
      caseFiles: caseFiles,
    };

    // 5. Fem la petició POST al webhook de Make.com des del nostre servidor proxy.
    // Aquesta petició SÍ que funcionarà, perquè no surt des de la xarxa restringida d'OpenAI.
    const makeResponse = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // 6. Verifiquem si la petició a Make.com ha tingut èxit.
    if (!makeResponse.ok) {
      // Si Make.com retorna un error, el registrem i l'enviem de tornada al GPT.
      const errorText = await makeResponse.text();
      console.error('Error from Make.com:', errorText);
      res.status(makeResponse.status).json({ error: 'Error forwarding request to Make.com', details: errorText });
      return;
    }

    // 7. Si tot ha anat bé, enviem una resposta d'èxit al GPT.
    // Aquesta és la resposta que el GPT mostrarà a l'usuari.
    res.status(200).json({ status: 'success', message: 'Query forwarded to Make.com successfully' });

  } catch (error) {
    // 8. Si hi ha qualsevol altre error en el nostre proxy, el capturem.
    console.error('Error in proxy function:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
