let state = 'pending'

export default {
  functional: true,
  props: {
    promise: null,
  },
  render: (h, ctx) => {
    const $slots = ctx.slots()

    if (state === 'pending') {
      ctx.props.promise
        .then(() => {
          state = 'resolve'
          ctx.parent.$forceUpdate()
        })
        .catch(err => {
          state = 'error'
          ctx.parent.$forceUpdate()
        })
    }

    if (state === 'pending') {
      return $slots.pending
    } else if (state === 'resolve') {
      state = 'pending'
      return $slots.default
    } else if (state === 'error') {
      state = 'pending'
      return $slots.error
    }
  },
}
