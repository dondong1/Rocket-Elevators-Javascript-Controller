let elevatorID = 1
let floorRequestButtonID = 1
let callButtonID = 1

class Column {
    constructor (_id, _status, _amountOfFloors, _amountOfElevators) {
        this.ID = _id;   
        this.status = _status; 
        this.amountOfFloors = _amountOfFloors;
        this.amountOfElevators = _amountOfElevators;
        this.elevatorsList = [];
        this.callButtonsList = [];

        this.createElevators(_amountOfFloors, _amountOfElevators);
        this.createCallButtons(_amountOfFloors);
    }
    
    //----------------------- Method ---------------------//
    createCallButtons(_amountOfFloors) {
        let buttonFloor = 1

        for (let i = 0; i < _amountOfFloors; i++) {
            if(buttonFloor < _amountOfFloors) { //If it's not the last floor
            let callButton = new CallButton(callButtonID, 'OFF', buttonFloor, 'Up') //id, status, floor, direction
            this.callButtonsList.push(callButton)
            callButtonID ++
            }
            if(buttonFloor > 1) { //If it is not the first floor
            let callButton = new CallButton(callButton, 'OFF', buttonFloor, 'Down') //id, status, floor, direction
            this.callButtonsList.push(callButton)
            callButtonID ++
            }
        }
    }

    createElevators(_amountOfFloors, _amountOfElevators) {
        for(let i = 0; i < _amountOfElevators; i++) {
            let elevator = new Elevator(elevatorID, 'idle', _amountOfFloors, 1) //id, status, amountOfFloors, currentFloor
            this.elevatorsList.push(elevator)
 //           console.log(elevator)
            elevatorID++
        }
    }


    //Simulate when a user press a button outside the elevator
    requestElevator(_floor, _direction) {
        let elevator = this.findElevator(_floor, _direction);
        elevator.floorRequestList.push(_floor);
        elevator.sortFloorList()
        elevator.move();
        elevator.operateDoors();
        return elevator
    };


    //score system depending on the current elevators state.  Since the bestScore and the referenceGap are higher
    //values than what could be possibly calculated.  The first elevator will always become the default bestElevator.
    //before being compared with to other elevators.  If two elevators get the same score, the nearest one is prioritized. 
    findElevator(requestedFloor, requestedDirection) {
        let bestElevatorInformations = {
            bestElevator: null,
            bestScore: 5,
            referenceGap: 100000000
        }

        this.elevatorsList.forEach(elevator => {
            //The elevator is at my floor and going in the direction I want
            if(requestedFloor == elevator.currentFloor && elevator.status == 'stopped' && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(1, elevator, bestElevatorInformations, requestedFloor)
            }
            //The elevator is lower than me, is coming up and I want to go up
            else if(requestedFloor > elevator.currentFloor && elevator.direction == 'Up' && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestElevatorInformations, requestedFloor)
            }
            //The elevator is higher than me, is coming down and I want to go down
            else if (requestedFloor < elevator.currentFloor && elevator.direction == 'Down' && requestedDirection == elevator.direction) {
                bestElevatorInformations = this.checkIfElevatorIsBetter(2, elevator, bestElevatorInformations, requestedFloor)
            }
            //The elevator is idle
            else if (elevator.status == 'idle') {
                bestElevatorInformations = this.checkIfElevatorIsBetter(3, elevator, bestElevatorInformations, requestedFloor)
            }   
            //The elevator is not available, but still could take the call if nothing better is found 
            else {
                bestElevatorInformations = this.checkIfElevatorIsBetter(4, elevator, bestElevatorInformations, requestedFloor)
            }
     
        });

        console.log();
        console.log("   >> >>> ELEVATOR " + bestElevatorInformations.bestElevator.ID + " WAS CALLED <<< <<");
        return bestElevatorInformations.bestElevator;

    }

    checkIfElevatorIsBetter(scoreToCheck, newElevator, bestElevatorInformations, floor) {
        if (scoreToCheck < bestElevatorInformations.bestScore) {
            bestElevatorInformations.bestScore = scoreToCheck
            bestElevatorInformations.bestElevator = newElevator
            bestElevatorInformations.referenceGap = Math.abs(newElevator.currentFloor - floor)
        }  else if (bestElevatorInformations.bestScore == scoreToCheck) {
            let gap = Math.abs(newElevator.currentFloor - floor)
            if(bestElevatorInformations.referenceGap > gap) {
                bestElevatorInformations.bestScore = scoreToCheck
                bestElevatorInformations.bestElevator = newElevator
                bestElevatorInformations.referenceGap = gap 
            }
        }

        return bestElevatorInformations

    }

}// Column

class Elevator {
    constructor (_id, _status, _amountOfFloors, _currentFloor) {
        this.ID = _id
        this.status = _status
        this.amountOfFloors = _amountOfFloors
        this.currentFloor = _currentFloor
        this.direction;
        this.door = new Door (_id, 'closed')
        this.floorRequestButtonsList = []
        this.floorRequestList = []

        this.createFloorRequestButtons(_amountOfFloors)
    }  

    createFloorRequestButtons(_amountOfFloors) {
        let buttonFloor = 1
        for (let i =0; i < _amountOfFloors; i++) {
            let floorRequestButton = new FloorRequestButton(floorRequestButtonID, 'OFF', buttonFloor) //id, status, floor
            this.floorRequestButtonsList.push(floorRequestButton)
            buttonFloor++
            floorRequestButtonID++
        }
    }


    //Simulate when a user press a button inside the elevator 
    requestFloor(floor) {
        this.floorRequestList.push(floor)
        this.sortFloorList()
        this.move()
        this.operateDoors()
    }

    move() {
        while (this.floorRequestList.length !=0) {
            let destination = this.floorRequestList[0]
            this.status = 'moving'
            if(this.currentFloor < destination) {
                this.direction = 'Up'
                while (this.currentFloor < destination) {
                    this.currentFloor++
                    console.log(this.ID + " move to current floor" + this.currentFloor);
                }
            } else if (this.currentFloor > destination) {
                this.direction = 'Down'
                while (this.currentFloor > destination) {
                    this.currentFloor--
                    console.log(this.ID + " move to current floor" + this.currentFloor);

                }
            }
            this.status = 'stopped'
            this.floorRequestList.shift()

        }
        this.status = 'idle'
    }

    sortFloorList() {
        if (this.direction == 'Up') {
            this.floorRequestButtonsList.sort(function(a, b){return a-b});
        } else {
            this.floorRequestList.sort(function(a, b){return b-a});

        }
    }

    operateDoors() {
        this.doorStatus = 'opened'
        console.log(this.doorStatus)
        //WAIT 5 seconds
        if (!this.overweight) {
            this.doorStatus = 'closing'
            if (!this.door.obstruction) {
                this.doorStatus = 'closed'
                console.log(this.doorStatus)
            } else {
                //WAIT: for the person to clear the way
                this.door.obstruction = false
                this.operateDoors()
            }
        } else {
            while (this.overweight) {
                //Activate overweight alarm, and wait for someone to get out
                this.overweight = false
             }
             this.operateDoors()
         }
            
    }   
 } // Elevator
 
 class CallButton {
     constuctor (_id, _status, _floor, _direction) {
         this.ID = _id
         this.status = _status
         this.floor = _floor
         this.direction = _direction
     }
 
    //Simulate when a user press a button inside the elevator 

 }

    class FloorRequestButton {
    constructor (_id, _status, _floor) {
        this.ID = _id 
        this.status = _status 
        this.floor = _floor
    }
}
    class Door {
        constructor(_id, _status) {
        this.ID = _id 
        this.status = _status  
        }      
    }

//========================Scenario 1 =======================/
function scenario1() {
let column = new Column(1, 'online', 10, 2) //id, status, amountOfFloors, amountOfElevators
column.elevatorsList[0].currentFloor =2
column.elevatorsList[1].currentFloor =6

let elevator = column.requestElevator(3, 'Up');
elevator.requestFloor(7);
console.log()
}

//======================== End Scenario 1 =======================*/

// ==================================Scenario 2===================
function scenario2() {
    console.log("****************************** SCENARIO 2: ******************************");
    let columnScenario2 = new Column(1, 'online', 10, 2);     
    columnScenario2.elevatorsList[0].currentFloor = 10;
    columnScenario2.elevatorsList[1].currentFloor = 3;
    console.log("Person 1: (elevator 2 is expected)");
    let elevator1 = columnScenario2.requestElevator(1, 'Up');
    elevator1.requestFloor(6);

    console.log("----------------------------------");
    console.log("Person 2: (elevator 2 is expected)");
    let elevator2 = columnScenario2.requestElevator(3, 'Up');
    elevator2.requestFloor(5);
    console.log("----------------------------------");

    console.log("Person 3: (elevator 1 is expected)");
    let elevator3 = columnScenario2.requestElevator(9, 'Down');
    elevator3.requestFloor(2);
    console.log("=================================="); 
}
// ==================================End Scenario 2==================*/

//=================================Scenario 3========================
function scenario3() {
    console.log();
    console.log("****************************** SCENARIO 3: ******************************");
    let columnScenario3 = new Column(1, 'online', 10, 2);     
    columnScenario3.elevatorsList[0].floor = 10;
    columnScenario3.elevatorsList[1].floor = 3;
    columnScenario3.elevatorsList[1].status = 'Up';
    
    console.log();
    console.log("Person 1: (elevator 1 is expected)");
    columnScenario3.requestElevator(3, 'Down');
    columnScenario3.elevatorsList[0].requestFloor(2, columnScenario3);
    console.log("----------------------------------");
    console.log();

    //2 minutes later elevator 1(B) finished its trip to 6th floor
    columnScenario3.elevatorsList[1].floor = 6;
    columnScenario3.elevatorsList[1].status = 'idle';

    console.log("Person 2: (elevator 2 is expected)");
    let elevator = columnScenario3.requestElevator(10, 'Down');
    elevator.requestFloor(3);
    console.log("==================================");
}
//==================================End Scenario 3====================*/
//scenario1();
//scenario2();
scenario3();
module.exports = {Column, Elevator, CallButton, FloorRequestButton, Door}