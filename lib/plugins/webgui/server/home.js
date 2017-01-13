const emailPlugin = appRequire('plugins/email/index');

exports.sendCode = (req, res) => {
  const email = req.body.email;
  emailPlugin.sendCode(email, '验证码', '您的验证码是：').then(success => {
    res.send('success');
  }).catch(err => {
    console.log(err);
    res.status(500).end();
  });
};