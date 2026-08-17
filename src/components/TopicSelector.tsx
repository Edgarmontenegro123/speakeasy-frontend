import type {Topic} from '../types'

type TopicSelectorProps = {
  topics: Topic[]
  onSelect: (topic: Topic) => void
}

function TopicSelector({topics, onSelect}: TopicSelectorProps) {
  return (
    <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
      {topics.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => onSelect(topic)}
          className="flex flex-col items-start gap-2 rounded-xl border border-neutral-200 p-4 text-left transition hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
        >
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
            {topic.level}
          </span>
          <span className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
            {topic.title}
          </span>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {topic.description}
          </span>
        </button>
      ))}
    </div>
  )
}

export default TopicSelector
