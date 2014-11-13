
Tasks = new Mongo.Collection("tasks");

if (Meteor.isServer) {
  Meteor.publish("tasks", function () {
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  });
}

if (Meteor.isClient) {
  // This code only runs on the client
  
  Meteor.subscribe("tasks");

  Template.body.helpers({
  
    tasks: function () {
      if (Session.get("hideCompleted")) {
        // If hide completed is checked, filter tasks
        return Tasks.find({checked: {$ne: true}}, {sort: {createdAt: -1}});
      } else {
        // Otherwise, return all of the tasks
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
  
    hideCompleted: function () {
      return Session.get("hideCompleted");
    },
  
    incompleteCount: function () {
      var count = Tasks.find({checked: {$ne: true}}).count();
      Session.set("incompleteTasks", parseInt(count));
      return count;
    },
  
    completeCount: function () {
      var count = Tasks.find({checked: {$ne: false}}).count();
      Session.set("completeTasks", parseInt(count));
      return count;
    },
  
    privateCount: function () {
      var count = Tasks.find({private: {$ne: false}}).count();
      Session.set("privateTasks", parseInt(count));
      return count;
    }
    
  }); // Template.body.helpers
  
  Template.body.events({
    
    "submit .new-task": function (event) {
    // This function is called when the new task form is submitted

      var text = event.target.text.value;
    
      Meteor.call("addTask", text);
      
      // Clear form
      event.target.text.value = "";
  
      // Prevent default form submit
      return false;
      
    }, // "submit .new-task"

    "change .hide-completed input": function (event) {
      Session.set("hideCompleted", event.target.checked);
    }

  }); // Template.body.events
  
  // For Semantic UI JS features
  Template.body.rendered = function(){
    $('.ui.checkbox').checkbox();
    $('.about.modal').modal('show');
  }
  
  Template.task.events({
    
    "click .toggle-checked": function () {
      // Set the checked property to the opposite of its current value
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    
    "click .delete": function () {
      Meteor.call("deleteTask", this._id);
    },
    
    "click .toggle-private": function () {
      Meteor.call("setPrivate", this._id, ! this.private);
    }

  });
  
  Template.task.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });
  
  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Template.completionGuageDashboard.rendered = function () {
    this.autorun(function (c) {
      completionGuage();
    });
  }


} // if (Meteor.isClient)

Meteor.methods({

  addTask: function (text) {
    // Make sure the user is logged in before inserting a task
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }

    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username
    });
  },

  deleteTask: function (taskId) {
    var task = Tasks.findOne(taskId);
    if (task.owner !== Meteor.userId()) {
      // Make sure only the owner can delete
      throw new Meteor.Error("not-authorized");
    } 
  
    Tasks.remove(taskId);
  },

  setChecked: function (taskId, setChecked) {
    var task = Tasks.findOne(taskId);
    if (task.owner !== Meteor.userId()) {
      // Make sure only the owner can check tasks off
      throw new Meteor.Error("not-authorized");
    }
    
    Tasks.update(taskId, { $set: { checked: setChecked} });
  },

  setPrivate: function (taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);
  
    // Make sure only the task owner can make a task private
    if (task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    
    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
  
});


function completionGuage() {
    
    var completionData = new Array();
    
    completionData[0] = 0;
    var totalTasks = 0;
    
    completionData[0] = Session.get('completeTasks');
    totalTasks = completionData[0] + Session.get('incompleteTasks');

    $('#completion-gauge').highcharts({
        chart: {
            type: 'solidgauge'
        },

        title: null,

        pane: {
            center: ['50%', '85%'],
            size: '140%',
            startAngle: -90,
            endAngle: 90,
            background: {
                backgroundColor: '#EEE',
                innerRadius: '60%',
                outerRadius: '100%',
                shape: 'arc'
            }
        },

        tooltip: {
            enabled: false
        },

        yAxis: {
            min: 0,
            max: totalTasks,
            title: {
                text: 'Completion'
            },

            stops: [
                [0.1, '#55BF3B'],
                [0.5, '#DDDF0D'],
                [0.9, '#DF5353']
            ],
            lineWidth: 0,
            minorTickInterval: null,
            tickPixelInterval: 400,
            tickWidth: 0,
            title: {
                y: -70
            },
            labels: {
                y: 16
            }
        },

        plotOptions: {
            solidgauge: {
                dataLabels: {
                    y: 5,
                    borderWidth: 0,
                    useHTML: true
                }
            }
        },

        credits: {
            enabled: false
        },

        series: [{
            name: 'Completed',
            data: completionData,
            dataLabels: {
                format: '<div style="text-align:center"><span style="font-size:25px;color:#7e7e7e">{y}</span><br/>' +
                    '<span style="font-size:12px;color:silver">Tasks Complete</span></div>'
            },
            tooltip: {
                valueSuffix: ' Tasks'
            }
        }]
    });
}