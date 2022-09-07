import { Component } from 'solid-js'

const ProgressBar: Component<{
  progress: number
  goal: number
}> = props => {
  return (
    <div class='m-2 p-1 border-2 border-[#6CB9D8] font-bold rounded'>
      <div class='flex gap-1'>
        <div
          style={{ 'flex-grow': props.progress }}
          class={`${
            props.goal - props.progress > 0 ? 'bg-[#3B94CB]' : 'bg-green-700'
          } text-center text-[#0C102E] `}
        >
          {props.goal - props.progress < 0
            ? `${props.progress} (+${props.progress - props.goal})`
            : props.progress}
        </div>
        {props.goal - props.progress > 0 && (
          <div
            style={{ 'flex-grow': props.goal - props.progress }}
            class={`bg-[#234B83] text-center font-bold text-[#180202] `}
          >
            {props.goal - props.progress}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgressBar
