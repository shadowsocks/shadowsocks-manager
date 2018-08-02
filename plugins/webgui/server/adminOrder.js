const orderPlugin = appRequire('plugins/webgui_order');

exports.getOrders = async (req, res) => {
  try {
    const orders = await orderPlugin.getOrders();
    res.send(orders);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.getOneOrder = async (req, res) => {
  try {
    const orderId = +req.params.orderId;
    const order = await orderPlugin.getOneOrder(orderId);
    res.send(order);
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.newOrder = async (req, res) => {
  try {
    const data = {};
    data.name = req.body.name;
    data.comment = req.body.comment;
    data.type = req.body.type;
    data.cycle = req.body.cycle;
    data.alipay = req.body.alipay;
    data.paypal = req.body.paypal;
    data.flow = req.body.flow;
    data.refTime = req.body.refTime;
    data.server = req.body.server;
    data.autoRemove = req.body.autoRemove;
    data.autoRemoveDelay = req.body.autoRemoveDelay;
    data.portRange = req.body.portRange;
    data.multiServerFlow = req.body.multiServerFlow;
    data.changeOrderType = req.body.changeOrderType;
    await orderPlugin.newOrder(data);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.editOrder = async (req, res) => {
  try {
    const data = {};
    data.id = +req.params.orderId;
    data.name = req.body.name;
    data.comment = req.body.comment;
    data.type = req.body.type;
    data.cycle = req.body.cycle;
    data.alipay = req.body.alipay;
    data.paypal = req.body.paypal;
    data.flow = req.body.flow;
    data.refTime = req.body.refTime;
    data.server = req.body.server;
    data.autoRemove = req.body.autoRemove;
    data.autoRemoveDelay = req.body.autoRemoveDelay;
    data.portRange = req.body.portRange;
    data.multiServerFlow = req.body.multiServerFlow;
    data.changeOrderType = req.body.changeOrderType;
    await orderPlugin.editOrder(data);
    res.send('success');
  } catch(err) {
    console.log(err);
    res.status(403).end();
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const orderId = +req.params.orderId;
    await orderPlugin.deleteOrder(orderId);
    res.send('success');
  } catch(err) {
    console.log(err);
    const errorData = ['account with this order exists', 'giftcard with this order exists'];
    if(errorData.indexOf(err) < 0) {
      return res.status(403).end();
    } else {
      return res.status(403).end(err);
    }
  }
};