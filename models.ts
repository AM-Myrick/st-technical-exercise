export interface IProject {
    isInLowCostCity: boolean
    overlapsWithPreviousProject: boolean
    overlapsWithNextProject: boolean
    startDate: Date
    endDate: Date
}