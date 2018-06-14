/* file : pipeline-consistency.js
MIT License

Copyright (c) 2018 Thomas Minier

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

'use strict'

const ConsistencyCriteria = require('../consistency-criteria.js')

const PC_UPDATE_MSG_TYPE = 'PC_UPDATE_MSG'

/**
 * build an update message for PC
 * @param  {string} opName - Name of the operation to apply
 * @param  {Array}  args - Arguments passed to the operation
 * @return {Object} Update message
 */
function pcUpdateMessage (opName, args) {
  return {
    type: PC_UPDATE_MSG_TYPE,
    opName,
    args
  }
}

/**
 * Criteria that implements Pipeline consistency
 * @extends ConsistencyCriteria
 * @author Thomas Minier
 */
class PipelineConsistency extends ConsistencyCriteria {
  setUp (communication) {
    communication.onBroadcast((id, message) => {
      switch (message.type) {
        case PC_UPDATE_MSG_TYPE:
          this.localApply(message.opName, message.args)
          break
        default:
          break
      }
    })
  }

  applyUpdate (opName, args) {
    const res = this.localApply(opName, args)
    this.communication().sendBroadcast(pcUpdateMessage(opName, args))
    return res
  }
}

module.exports = PipelineConsistency
