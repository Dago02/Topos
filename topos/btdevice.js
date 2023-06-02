class BTDevice {

	btPort = null;
	fReadInprogress = false;
	fifo = "";

	async init( callback=null ) {
	  if (this.btPort==null) {
		  //Connect to a serial port
		  navigator.serial
			.requestPort()
			.then((port) => {
			    // Connect to `port` or add it to the list of available ports.
				try {
					port.open({ baudRate: 9600});
					this.btPort = port;
					if (callback != null) {
						callback(true);
					}
				} catch {
					this.btPort = null;
					if (callback != null) {
						callback(false);
					}
				}
			})
			.catch((e) => {
			  // The user didn't select a port.
			  this.btPort = null;
			  if (callback != null) {
				callback(false);
			  }
			});
		} else {
			this.btPort.close();
			this.btPort = null;
			if (callback != null) {
				callback(false);
			}
		}
	}
	
	isReady() {
		return this.btPort!=null;
	}
	
	write( str ) {
		if (this.btPort!=null) {
			const encoder = new TextEncoder();
			const writer = this.btPort.writable.getWriter();
			writer.write(encoder.encode(str));
			writer.releaseLock();
		}
	}
	
	async read( callback ) {
		if (this.btPort == null) {
			return false;
		}
		if (this.fReadInprogress) {
			return false;
		}
		if (this.btPort.readable) {	
			var reader = this.btPort.readable.getReader();
			try {
			  const decoder = new TextDecoder();
			  this.fReadInprogress = true;
			  const readerData = await reader.read();		  
			  this.fifo = this.fifo+decoder.decode(readerData.value);
			  var pos = this.fifo.search("\r");
			  if (pos!=-1) {
				callback(this.fifo.slice(0, pos));
				if (this.fifo[pos+1] == '\n') {
					pos++;
				}
				this.fifo = this.fifo.slice(pos+1,-1);
				return true;
			  }
			  return false;
			} catch (err) {
			  const errorMessage = `error reading data: ${err}`;
			  console.error(errorMessage);
			  return false;
			} finally {
				reader.releaseLock();
				this.fReadInprogress = false;
			}
		}
	}
}