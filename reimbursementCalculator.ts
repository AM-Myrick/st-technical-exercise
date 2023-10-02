import { LOW_COST_FULL_DAY, HIGH_COST_FULL_DAY, LOW_COST_TRAVEL_DAY, HIGH_COST_TRAVEL_DAY } from "./constants";
import { IProject } from "./models"

/**
 * Take the difference between the dates and divide by milliseconds per day.
 * Round to nearest whole number to deal with DST.
 */
export const dateDiff = (first: Date, second: Date): number  => {        
    return Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
}

// a day is a travel day if it's the start or end date of a project or it's on either side of a gap between projects
// a day is only a travel day if one or more of the below criteria is true
// 1. It's the start or end date of a project
// 2. It's the start or end date of a sequence of projects
// 3. It's the day before or after a gap between projects

// all other days are full days, if a travel day overlaps with another project, it's now a full day
export const calculateSetReimbursementCost = (projects: IProject[]): number => {
    let reimbursementCost = 0
    projects.forEach(({ startDate, endDate, isInLowCostCity, overlapsWithPreviousProject, overlapsWithNextProject }, index) => {
        const differenceBetweenStartAndEnd = dateDiff(startDate, endDate)
        const startAndEndAreDifferentDays = differenceBetweenStartAndEnd > 0

        // if there's no overlap with other projects or the end date, reimburse the start date
        const noOverlap = !overlapsWithPreviousProject && !overlapsWithNextProject
        if (!overlapsWithPreviousProject && startAndEndAreDifferentDays || noOverlap && !startAndEndAreDifferentDays) {
            reimbursementCost += isInLowCostCity ? LOW_COST_TRAVEL_DAY : HIGH_COST_TRAVEL_DAY
        }

        // reimburse any days inbetween the start and end date
        if (startAndEndAreDifferentDays) {
            const daysBetweenStartAndEnd = differenceBetweenStartAndEnd - 1
            reimbursementCost += isInLowCostCity ? LOW_COST_FULL_DAY * daysBetweenStartAndEnd : HIGH_COST_FULL_DAY * daysBetweenStartAndEnd
            // reimburse the end date if there's no overlap
            if (!overlapsWithNextProject) {
                reimbursementCost += isInLowCostCity ? LOW_COST_TRAVEL_DAY : HIGH_COST_TRAVEL_DAY
            }
        }
    })
    return reimbursementCost
}