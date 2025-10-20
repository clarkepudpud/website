export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { question, answer } = req.body;

    console.log(`[LOGGED] ${new Date().toISOString()}`);
    console.log(`Q: ${question}`);
    console.log(`A: ${answer}`);

    // you can use Vercel Logs to view these
    return res.status(200).json({ message: "Logged successfully" });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
