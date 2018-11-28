class causalBuffer{

	constructor(){
		this.buffer = []
	}

	addUser(id){
		this.buffer.push([id])
	}

	removeUser(id){
		var index = this.buffer.findIndex(map => map[0] === id)
		if(index != -1){
			this.buffer.splice(index, 1)
		}
	}

	addMessage(id, message){
		var index = this.buffer.findIndex(map => map[0] === id)
		if(index != -1){
			if(this.buffer[index].findIndex(m => m === message) == -1){
				this.buffer[index].push(message)
			}
		} else {
			this.buffer.push([id, message])
		}
		// NOT WORKING
		this.sort(id)
	}

	removeMessage(id, message){
		var indexI = this.buffer.findIndex(map => map[0] === id)
		if(indexI != -1){
			var indexM = this.buffer.findIndex(map => map[0] === id)
			if(indexM != -1){
				this.buffer[indexI].splice(indexM, 1)
			}
		}
		// NOT WORKING EITHER
		this.sort(id)
	}

	sort(id){
		var index = this.buffer.findIndex(map => map[0] === id)
		if(index != -1){
			var tmp = this.buffer[index][0]
			this.buffer[index].splice(0,1)
			this.buffer[index].sort(function(a,b){
				return a.counter - b.counter
			})
			this.buffer[index].reverse()
			this.buffer[index].push(tmp)
			this.buffer[index].reverse()
		}
	}

	getUser(indexUser){
		return this.buffer[indexUser][0]
	}

	getMessage(indexUser, indexMessage){
		return this.buffer[indexUser][indexMessage]
	}

	findIndex(id){
		return this.buffer.findIndex(map => map[0] === id)
	}

	length(){
		return this.buffer.length
	}

	length(index){
		return this.buffer[index].length
	}
}

module.exports = causalBuffer
