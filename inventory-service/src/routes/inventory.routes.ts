import { Router } from 'express';
import Inventory from '../models/inventory.model';

const router = Router();

router.get('/:productId', async (req, res) => {
  const inventory = await Inventory.findOne({ where: { productId: req.params.productId } });
  res.json({ success: true, data: inventory });
});

router.post('/reserve', async (req, res) => {
  const { productId, quantity } = req.body;
  const inventory = await Inventory.findOne({ where: { productId } });
  if (inventory && inventory.availableQuantity >= quantity) {
    inventory.reservedQuantity += quantity;
    inventory.availableQuantity -= quantity;
    await inventory.save();
    res.json({ success: true, data: inventory });
  } else {
    res.status(400).json({ success: false, error: 'Insufficient inventory' });
  }
});

export default router;

