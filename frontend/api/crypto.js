export default function handler(req, res) {
  const token = crypto.randomUUID();
  res.status(200).json({ token });
}
