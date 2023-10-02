import { VALID_COST_FLAGS, COST_FLAG_INDEX, START_DATE_INDEX, END_DATE_INDEX, SINGLE_PROJECT_ARG_NUM } from "./constants"
import { IProject } from "./models"

const reimbursementArguments = Bun.argv.slice(2)
const setOfProjects: IProject[] = []

/**
 * Take the difference between the dates and divide by milliseconds per day.
 * Round to nearest whole number to deal with DST.
 */
export const dateDiff = (first: Date, second: Date): number  => {        
    return Math.round((second.getTime() - first.getTime()) / (1000 * 60 * 60 * 24));
}

const checkCostFlagValidity = (costFlag: string): boolean => {
    if (!VALID_COST_FLAGS.includes(costFlag)) {
        console.error(`The cost flag must match one of these values: ${VALID_COST_FLAGS}, you entered ${costFlag}`)
        return false
    }
    return true
}

const checkDateValidity = (startDate: string, endDate: string): boolean => {
    const isValidDate = (d: string): boolean => !isNaN(new Date(d).getTime())
    const startDateValid = isValidDate(startDate)
    const endDateValid = isValidDate(endDate)

    if (!startDateValid) {
        console.error(`The start date must be in a valid form [mm/dd/yyyy], you entered ${startDate}`)
    }
    
    if (!endDateValid) {
        console.error(`The end date must be in the form of [mm/dd/yyyy], you entered ${endDate}`)
    }
    
    const startDateObject = new Date(startDate)
    const endDateObject = new Date(endDate)

    if (startDateObject && endDateObject && startDateObject > endDateObject) {
        console.error(`The start date must be before the end date, you entered startDate: ${startDate} and endDate: ${endDate}`)
        return false
    }
    
    return startDateValid && endDateValid
}

// ensure arguments given by the user are in the format we need
// if they are, we update the projects array with the given project
const checkArgumentValidity = (projectArguments: string[]): boolean => {
    const costFlag = projectArguments[COST_FLAG_INDEX]
    const isValidCostFlag = checkCostFlagValidity(costFlag)

    if (!isValidCostFlag) {
        return false
    }

    const startDate = projectArguments[START_DATE_INDEX]
    const endDate = projectArguments[END_DATE_INDEX]
    const areValidDates = checkDateValidity(startDate, endDate)

    if (!areValidDates) {
        return false
    }

    return true
}

const createProjects = (projectArguments: string[][]) => {
    projectArguments.forEach((project, index) => {
        const startDate = new Date(project[START_DATE_INDEX])
        const endDate = new Date(project[END_DATE_INDEX])
        const isInLowCostCity = project[COST_FLAG_INDEX].toLocaleLowerCase().includes("l")

        const previousProject = index === 0 ? null : setOfProjects?.[index - 1]
        let overlapsWithPreviousProject = false

        if (previousProject) {
            overlapsWithPreviousProject = dateDiff(previousProject.endDate, startDate) === 0
        }

        const nextProject = projectArguments?.[index + 1]
        let overlapsWithNextProject = false
        if (nextProject) {
            const nextProjectStartDate = new Date(nextProject[START_DATE_INDEX])
            overlapsWithNextProject = dateDiff(endDate, nextProjectStartDate) === 0
        }
    
        setOfProjects.push({
            overlapsWithPreviousProject,
            overlapsWithNextProject,
            startDate,
            endDate,
            isInLowCostCity
        })
    })
}

// separates the arguments provided by the user into projects
const parseProjects = (reimbursementArgs: string[]): boolean => {
    const validProjectArguments: string[][] = []
    let allProjectsValid = true
    // if multiple projects are being reimbursed, chunk the given array into individual projects
    if (reimbursementArgs.length > SINGLE_PROJECT_ARG_NUM) {
        const chunkedProjectArguments = reimbursementArgs.reduce((resultArray: string[][], item, index) => { 
            const chunkIndex = Math.floor(index/SINGLE_PROJECT_ARG_NUM)
          
            if(!resultArray[chunkIndex]) {
              resultArray[chunkIndex] = [] // start a new chunk
            }
          
            resultArray[chunkIndex].push(item)
          
            return resultArray
          }, [])

          chunkedProjectArguments.forEach((projectArguments) => {
            const isProjectValid = checkArgumentValidity(projectArguments)
            if (!isProjectValid) allProjectsValid = false
            else validProjectArguments.push(projectArguments)
          })
    } else {
        allProjectsValid = checkArgumentValidity(reimbursementArgs)
        validProjectArguments.push(reimbursementArgs)
    }

    if (allProjectsValid) {
        createProjects(validProjectArguments)
        return true
    }
    return false
}

const projectsParsedSuccessfully = parseProjects(reimbursementArguments)
if (projectsParsedSuccessfully) {
    console.log("Project(s) parsed successfully!")
}
else console.error("Please fix the above error(s) and try again.")