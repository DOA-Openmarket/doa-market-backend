import { Router } from 'express';
import * as addressController from '../controllers/address.controller';

const router = Router({ mergeParams: true });

router.get('/', addressController.getAddresses);
router.post('/', addressController.createAddress);
router.put('/:addressId', addressController.updateAddress);
router.delete('/:addressId', addressController.deleteAddress);

export default router;

