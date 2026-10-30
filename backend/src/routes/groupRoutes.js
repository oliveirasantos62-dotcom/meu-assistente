import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listGroups,createGroup,updateGroup,deleteGroup,listMembers,inviteMember,listInvitations,respondInvitation,updateMember,createActivity,listActivities,logActivity,activityHistory } from '../controllers/groupController.js';
const router=Router(); router.use(authMiddleware);
router.get('/',listGroups); router.post('/',createGroup); router.get('/invitations/pending',listInvitations); router.patch('/invitations/:id',respondInvitation);
router.get('/:id/members',listMembers); router.post('/:id/invite',inviteMember); router.patch('/:id/members/:memberId',updateMember);
router.get('/:id/activities',listActivities); router.post('/:id/activities',createActivity); router.post('/:id/activities/:activityId/log',logActivity); router.get('/:id/activities/:activityId/history',activityHistory);
router.patch('/:id',updateGroup); router.delete('/:id',deleteGroup); export default router;
