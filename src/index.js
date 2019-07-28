import isEmpty from 'lodash.isempty'

const convertVNodeArray = function(h, wrapperTag, nodes) {
  if (!nodes) {
    return
  }

  // for arrays and single text nodes
  if ((Array.isArray(nodes) && nodes.length > 1) || !nodes[0].tag) {
    return h(wrapperTag, {}, nodes)
  }

  return nodes[0]
}

const isPromise = promise =>
  typeof promise.then === 'function' && typeof promise.catch === 'function'

const PROMISE_STATE = {
  BYPASSED: 0,
  PENDING: 1,
  FULFILLED: 2,
  REJECTED: 3,
  EMPTY: 4,
}

export default {
  props: {
    path: {
      type: String,
    },
    tag: {
      type: String,
      default: 'span',
    },
    promise: {
      required: true,
      validator: p => isPromise(p),
    },
    pendingDelay: {
      type: [Number, String],
      default: 200,
    },
  },
  data: () => ({
    state: PROMISE_STATE.BYPASSED,
  }),
  watch: {
    promise: {
      immediate: true,
      handler(promise) {
        if (this.pendingDelay > 0) {
          if (this.timerId) {
            clearTimeout(this.timerId)
          }
          this.timerId = setTimeout(() => {
            this.state = PROMISE_STATE.PENDING
          }, this.pendingDelay)
        } else {
          this.state = PROMISE_STATE.PENDING
        }

        promise
          .then(data => {
            if (this.promise === promise) {
              this.data = data

              if (this.path) {
                const result = this.path
                  .split('.')
                  .reduce((pre, next) => pre[next], data)

                this.state = isEmpty(result)
                  ? PROMISE_STATE.EMPTY
                  : PROMISE_STATE.FULFILLED
              } else {
                this.state = PROMISE_STATE.FULFILLED
              }
            }
          })
          .catch(err => {
            if (this.promise === promise) {
              this.error = err
              this.state = PROMISE_STATE.REJECTED
            }
          })
          .finally(() => {
            if (this.timerId) {
              clearTimeout(this.timerId)
            }
          })
      },
    },
  },
  render(h) {
    if (this.$scopedSlots.combined) {
      const node = this.$scopedSlots.combined({
        data: this.data,
        error: this.error,
        isEmpty: this.state === PROMISE_STATE.EMPTY,
        isPending: this.state === PROMISE_STATE.PENDING,
        isBypassed: this.state === PROMISE_STATE.BYPASSED,
      })

      return convertVNodeArray(h, this.tag, node)
    }

    switch (this.state) {
      case PROMISE_STATE.PENDING: {
        const pendingSlot = this.$slots.pending
        return convertVNodeArray(h, this.tag, pendingSlot)
      }

      case PROMISE_STATE.FULFILLED: {
        const node = this.$scopedSlots.default(this.data)
        return convertVNodeArray(h, this.tag, node)
      }

      case PROMISE_STATE.REJECTED: {
        const node = this.$scopedSlots.rejected(this.error)
        return convertVNodeArray(h, this.tag, node)
      }

      case PROMISE_STATE.EMPTY: {
        const node = this.$scopedSlots.empty(this.data)
        return convertVNodeArray(h, this.tag, node)
      }

      case PROMISE_STATE.BYPASSED:
      default:
        return h()
    }
  },
}
