import { Component, createSignal, createEffect } from 'solid-js'
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

  // Filter burpees to only include last 7 days
  const last7DaysBurpees = (burpees: BurpeeRecord[] | undefined) =>
    burpees
      ? groupBurpeesByDay(burpees || []).filter(group => {
          const today = new Date()
          const [day, month, year] = group.day.split('/')
          const groupDate = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day)
          )
          const diffTime = Math.abs(today.getTime() - groupDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          return diffDays <= 7 && diffDays > 1
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
    return Math.floor(
      burpeesToGo(burpees) /
        Math.ceil(
          (last7DaysBurpees(props.burpees)?.reduce(
            (acc, day) => acc + day.sum,
            0
          ) || 0) / 7
        )
    )
  }

  // Estimated date till goal
  const estimatedFinishDate = (burpees: BurpeeRecord[] | undefined) => {
    const finishDate = new Date()
    finishDate.setDate(finishDate.getDate() + estimatedDaysLeft(burpees))
    return finishDate
  }

  return (
    <div class='flex flex-col justify-between'>
      {/* Body */}
      <div class='text-center py-4 px-8 bg-[#14204A]'>
        {/* Today's Progress */}
        <h2>Today's Progress</h2>
        <ProgressBar
          progress={todayBurpees(props.burpees)?.sum || 0}
          goal={Math.ceil(
            (props.goal - totalBurpees(props.burpees || [])) /
              daysLeft(props.endDate)
          )}
        />
        {/* Last 3 recordings from today, showing minutes since it happened */}
        <div>
          {todayBurpees(props.burpees)
            ?.burpees.sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(-1)
            .map(burpee => (
              <div>
                {burpee.count} burpees
                {' - '}
                {Math.floor(
                  (new Date().getTime() - new Date(burpee.date).getTime()) /
                    (1000 * 60)
                )}{' '}
                minutes ago
              </div>
            ))}
        </div>
      </div>

      <div class='py-4 px-8 flex flex-col h-full justify-around'>
        <div>
          <h2>Against 7 day average </h2>
          <ProgressBar
            progress={todayBurpees(props.burpees)?.sum || 0}
            goal={Math.ceil(
              (last7DaysBurpees(props.burpees)?.reduce(
                (acc, day) => acc + day.sum,
                0
              ) || 0) / 7
            )}
          />
        </div>
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
          <h2>Goal days left ({props.endDate.toLocaleDateString()})</h2>
          <ProgressBar
            progress={daysSinceFirstBurpee(props.burpees)}
            goal={daysSinceFirstBurpee(props.burpees) + daysLeft(props.endDate)}
          />
        </div>
        <div>
          <h2>Goal Progress</h2>
          <ProgressBar
            progress={totalBurpees(props.burpees || [])}
            goal={props.goal}
          />
        </div>
      </div>
      <div class='text-center py-4 px-8 bg-[#14204A]  w-full'>
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
