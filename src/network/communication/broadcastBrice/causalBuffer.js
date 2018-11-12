class causalBuffer{

	constructor(){
		this.buffer = []
	}

	addUser(id){
		this.buffer.push([id])
	}

	removeUser(id){
		var index = this.buffer.indexOf(map => map[0] === id)
		if(index != -1){
			this.buffer.splice(index, 1)
		}
	}

	addMessage(id, message){
		var index = this.buffer.indexOf(map => map[0] === id)
		if(index != -1){
			this.buffer[index].push(message)
		}
		this.sort(id)
	}

	removeMessage(id, message){
		var indexI = this.buffer.indexOf(map => map[0] === id)
		if(indexI != -1){
			var indexM = this.buffer.indexOf(map => map[0] === id)
			if(indexM != -1){
				this.buffer[indexI].splice(indexM, 1)
			}
		}
		this.sort(id)
	}

	sort(id){
		var index = this.buffer.indexOf(map => map[0] === id)
		if(index != -1){
			var tmp = this.buffer[index][0]
			this.buffer[index].splice(0,1)
			this.buffer.sort(function(a,b){
				return a.counter - b.counter
			})
			this.buffer.reverse()
			this.buffer.push(tmp)
			this.buffer.reverse()
		}
	}
}

module.exports = causalBuffer