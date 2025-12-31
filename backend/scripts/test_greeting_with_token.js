const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');

(async () => {
  try {
    // Fetch an existing user from the running server (no DB access required here)
    const usersRes = await fetch('http://localhost:5000/api/users');
    const usersBody = await usersRes.json();
    const user = (usersBody && usersBody.data && usersBody.data[0]) || null;
    if (!user) {
      console.error('No user returned from /api/users');
      process.exit(1);
    }
    const secret = process.env.JWT_SECRET || 'your-jwt-secret';
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role, name: user.name }, secret, { expiresIn: '7d' });
    console.log('Using user:', user.name, user.email);

    const response = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-auth-token': token
      },
      body: JSON.stringify({ prompt: 'Hello' })
    });
    const data = await response.json();
    console.log('Response:', data);
    process.exit(0);
  } catch (e) {
    console.error('Error', e.message || e);
    process.exit(1);
  }
})();
