export default function health(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ status: 'ok', service: 'scramjet-website' });
}
