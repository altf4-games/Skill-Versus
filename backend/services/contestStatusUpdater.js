import Contest from '../models/Contest.js';
import { generateLeaderboard } from '../controllers/contestController.js';
import ratingService from './ratingService.js';

/**
 * Stateless contest status helpers.
 * No background interval - called on-demand from controllers.
 */

/**
 * Update a single contest's status based on current time.
 * Returns true if the status changed.
 */
export const updateContestStatus = async (contest) => {
  const now = new Date();
  const oldStatus = contest.status;

  let newStatus;
  if (now < contest.startTime) {
    newStatus = 'upcoming';
  } else if (now <= contest.endTime) {
    newStatus = 'active';
  } else {
    newStatus = 'finished';
  }

  if (oldStatus === newStatus) {
    return false;
  }

  console.log(`Contest ${contest.title}: ${oldStatus} -> ${newStatus}`);
  contest.status = newStatus;
  await contest.save();

  if (newStatus === 'finished') {
    await handleContestEnd(contest);
  }

  return true;
};

/**
 * Finalise a contest: save final standings + update CP ratings.
 */
export const handleContestEnd = async (contest) => {
  try {
    console.log(`Contest finished: ${contest.title}`);

    const finalStandings = await generateLeaderboard(contest._id.toString());

    contest.finalStandings = finalStandings;
    contest.totalParticipants = finalStandings.length;
    await contest.save();

    console.log(`Final standings saved for ${contest.title}: ${finalStandings.length} participants`);

    if (finalStandings.length > 0) {
      await ratingService.updateContestRatings(contest._id.toString(), finalStandings);
      console.log(`CP ratings updated for contest ${contest.title}`);
    }
  } catch (error) {
    console.error(`Error handling contest end for ${contest.title}:`, error);
  }
};

/**
 * Scan all active contests and update statuses that have changed.
 * Can be called manually from an admin endpoint if needed.
 */
export const updateAllContestStatuses = async () => {
  const now = new Date();

  const contestsToUpdate = await Contest.find({
    isActive: true,
    $or: [
      { status: 'upcoming', startTime: { $lte: now } },
      { status: 'active', endTime: { $lte: now } },
    ],
  });

  if (contestsToUpdate.length > 0) {
    console.log(`Found ${contestsToUpdate.length} contests needing status updates`);
  }

  for (const contest of contestsToUpdate) {
    await updateContestStatus(contest);
  }

  return contestsToUpdate.length;
};
