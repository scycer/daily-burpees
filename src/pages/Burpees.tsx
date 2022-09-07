import { Component, createSignal } from 'solid-js'
import { BurpeeRecord } from '../App'
import ProgressBar from '../components/ProgressBar'

const Burpees: Component<{
  burpees?: BurpeeRecord[]
  count: number
  updateCount: (count: number) => void
  addBurpeeRecord: () => void
  goal: number
  endDate: Date
  dailyGoal: number
}> = props => {
  // ###############################
  // Settings
  // ###############################
  const settings = {
    defaultAmount: 10,
    incDecAmount: 5
  }

  // ###############################
  // Core derived data
  // ###############################

  // First Burpee
  const firstBurpee = (burpees: BurpeeRecord[]) =>
    burpees?.reduce(
      (acc, burpee) => {
        if (!acc || acc.date > burpee.date) {
          return burpee
        }
        return acc
      },
      { date: new Date() }
    )

  // Total Burpees count
  const totalBurpees = (burpees: BurpeeRecord[]) =>
    burpees?.reduce((acc, burpee) => {
      return acc + burpee.count
    }, 0) || 0

  // Group BurpeeRecords by day date in an array, each day has the count of burpees and original counts
  const groupBurpeesByDay = (
    burpees: BurpeeRecord[]
  ): { day: string; sum: number; burpees: BurpeeRecord[] }[] => {
    const groupedBurpees: {
      day: string
      sum: number
      burpees: BurpeeRecord[]
    }[] = []
    burpees.forEach(burpee => {
      const day = burpee.date.toLocaleDateString()
      const dayIndex = groupedBurpees.findIndex(gb => gb.day === day)
      if (dayIndex === -1) {
        groupedBurpees.push({ day: day, sum: burpee.count, burpees: [burpee] })
      } else {
        groupedBurpees[dayIndex].sum += burpee.count
        groupedBurpees[dayIndex].burpees.push(burpee)
      }
    })
    return groupedBurpees
  }

  // Filter burpees to only include the current day
  const todayBurpees = (burpees: BurpeeRecord[] | undefined) =>
    burpees
      ? groupBurpeesByDay(burpees || []).find(group => {
          return group.day === new Date().toLocaleDateString()
        })
      : undefined

  // Daily average
  const dailyAverage = (burpees: BurpeeRecord[] | undefined) =>
    Math.floor(
      burpees && burpees?.length > 0
        ? totalBurpees(burpees) / groupBurpeesByDay(burpees).length
        : 0
    )

  // Burpees to go
  const burpeesToGo = (burpees: BurpeeRecord[] | undefined) =>
    props.goal - totalBurpees(burpees || [])

  // ###############################
  // Calculate Progress
  // ###############################

  // Days since first burpee
  const daysSinceFirstBurpee = (burpees: BurpeeRecord[] | undefined) =>
    burpees && firstBurpee(burpees)
      ? Math.floor(
          (new Date().getTime() -
            new Date(firstBurpee(burpees).date).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

  // Days till goal
  const daysLeft = (endDate: Date) =>
    Math.floor((endDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))

  // Estimated days till goal
  const estimatedDaysLeft = (burpees: BurpeeRecord[] | undefined) => {
    return Math.floor(burpeesToGo(burpees) / dailyAverage(burpees))
  }

  // Estimated date till goal
  const estimatedFinishDate = (burpees: BurpeeRecord[] | undefined) => {
    const finishDate = new Date()
    finishDate.setDate(finishDate.getDate() + estimatedDaysLeft(burpees))
    return finishDate
  }

  return (
    <div class='h-max'>
      {/* Body */}
      <div class='text-center py-4 px-8 bg-[#14204A]'>
        {/* Today's Progress */}
        <h2>Today's Progress</h2>
        <ProgressBar
          progress={todayBurpees(props.burpees)?.sum || 0}
          goal={props.dailyGoal}
        />
      </div>

      <div class='py-4 px-8 flex flex-col h-full justify-around'>
        <div>
          <h2>
            Estimated Days Left (
            {estimatedFinishDate(props.burpees).toLocaleDateString()})
          </h2>
          <ProgressBar
            progress={daysSinceFirstBurpee(props.burpees)}
            goal={
              daysSinceFirstBurpee(props.burpees) +
              estimatedDaysLeft(props.burpees)
            }
          />
        </div>
        <div>
          <h2>Average per day </h2>
          <ProgressBar
            progress={dailyAverage(props.burpees)}
            goal={props.dailyGoal}
          />
        </div>
        <div>
          <h2>Goal Progress</h2>
          <ProgressBar
            progress={totalBurpees(props.burpees || [])}
            goal={props.goal}
          />
        </div>
        <div>
          <h2>Goal days left ({props.endDate.toLocaleDateString()})</h2>
          <ProgressBar
            progress={daysSinceFirstBurpee(props.burpees)}
            goal={daysLeft(props.endDate)}
          />
        </div>
      </div>
      <div class='text-center py-4 px-8 bg-[#14204A] bottom-0 absolute w-full'>
        {/* Record Session - Count, a button to increase and decrease count and save */}
        <div class=''>
          <h2>Record Session</h2>
          <div class='flex gaps-4 justify m-4'>
            <button
              class='bg-[#B30F0F] text-white px-4 py-2 rounded-md shadow-sm'
              onClick={() => props.addBurpeeRecord()}
            >
              Save
            </button>

            <p class='m-auto font-bold'>{props.count}</p>
            <div class='flex gap-6'>
              <button
                class={`bg-[#3B94CB] text-white px-4 py-2 rounded-md shadow-sm`}
                onClick={() =>
                  props.updateCount(
                    props.count < 6 ? 5 : props.count - settings.incDecAmount
                  )
                }
              >
                -{settings.incDecAmount}
              </button>
              <button
                class='bg-[#3B94CB] text-white px-4 py-2 rounded-md shadow-sm'
                onClick={() =>
                  props.updateCount(props.count + settings.incDecAmount)
                }
              >
                +{settings.incDecAmount}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Burpees
