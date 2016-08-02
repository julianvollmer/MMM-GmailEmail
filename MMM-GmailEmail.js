Module.register("MMM-GmailEmail",{
    defaults: {
        text: "Hello World!",
        lists: "some list",
        itemsCount: "3",
        
    },

    socketNotificationReceived: function(notification, payload) {
        
        if(notification === "EMAILGMAIL"){
            // this.mails.push(payload);
            //this.sendSocketNotification("LOG", payload);
        }

        if(notification === "UPDATE"){
            this.updateDom(3000);       
        }
        
        if(notification === "UPDATE_GMAILEMAIL"){
            this.mails = payload;
            this.updateDom(3000);       
        }

        this.sendSocketNotification("LOG", payload);
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("table");  
        wrapper.className = "normal small light";
        if(this.mails.length === 0){
          wrapper.innerHTML = "Keine ungelesenen Mails."
        }
        else{
              var header = document.createElement("tr");
              header.innerHTML = "Ungelesene Mails: " + this.mails.length;
              header.className = "title bright";
              wrapper.appendChild(header);
          for (var i = 0; i < this.config.itemsCount && i < this.mails.length; i++) {
              var titleWrapper = document.createElement("tr");
              titleWrapper.innerHTML = this.mails[i];
              titleWrapper.className = "title bright";
              wrapper.appendChild(titleWrapper);
          }
        }

        return wrapper;
        
    },

    start: function() {        
        this.mails = [];
        this.sendSocketNotification("CONNECTED", "wtf");
        this.update();
    },

    update: function () {

        this.sendSocketNotification("UPDATEUI", "options");
    }
});
