//maze configuration variables
const width=window.innerWidth<600?window.innerWidth:window.innerWidth-1;
const height=window.innerHeight-4;
//const cells=10;
const cellsHorizontal=window.innerWidth<600?8:16;
const cellsVertical=window.innerWidth<600?12:10;
cellWidth=width/cellsHorizontal;
cellHeight=height/cellsVertical;
const borderThickness=5;
const mazeWallThickness=7; 

//intial setting of matter objects
const {Engine,Runner,Render,World,Bodies,MouseConstraint,Mouse,Body,Events}=Matter;
const engine=Engine.create();
engine.world.gravity.y=0;
const {world}=engine;
const render=Render.create({
    element:document.body,
    engine:engine,
    options:{
        wireframes:false,
        width,
        height,
    }
});
Render.run(render);
Runner.run(Runner.create(),engine);


//walls
const walls=[
    Bodies.rectangle(width/2,0,width,borderThickness,{isStatic:true}),
    Bodies.rectangle(width/2,height,width,borderThickness,{isStatic:true}),
    Bodies.rectangle(0,height/2,borderThickness,height,{isStatic:true}),
    Bodies.rectangle(width,height/2,borderThickness,height,{isStatic:true})
];
World.add(world,walls);

//maze genaeration

// shuffle array function for randomizing the neighbours
const shuffle=(arr)=>{
    let counter=arr.length;
    while(counter>0){
        let randomIndex=Math.floor(Math.random()*counter);
        counter--;
        let temp=arr[counter];
        arr[counter]=arr[randomIndex];
        arr[randomIndex]=temp;
    }
    return arr;
}

// array for maze gird cells. eg:3X3 array
// false means unvisited true means vistited
const grid=new Array(cellsVertical).fill(null).map(()=>{
    return new Array(cellsHorizontal).fill(false);
});

// array that reperesents vertical inner borders of cells. for 3X3 grid vertical is 3X2
// false means closed (inital condition) true means open
const verticalWalls=new Array(cellsVertical).fill(null)
                                .map(()=>Array(cellsHorizontal-1).fill(false));

// horizontal walls. for 3X3 grid horizontal is 2X3
const horizontalWalls=Array(cellsVertical-1).fill(null)
                              .map(()=>Array(cellsHorizontal).fill(false));

// varibles indicating the random  starting cell
const startRow=Math.floor(Math.random()*cellsVertical);
const startColumn=Math.floor(Math.random()*cellsHorizontal);

const mazeGenerator=(row,column)=>{
    // if this cell  grid[row][column] is visited do nothing  and  return
    if(grid[row][column]){
        return;
    }
    // if not Mark this cell as Visited
    grid[row][column]=true;
    // Assemble  randomly ordered list of neighbours
    const neighbours=shuffle([
        [row-1,column,'up'],
        [row,column+1,'right'],
         [row+1,column,'down'],
        [row,column-1,'left']
    ]);
    
    // for each neighbour do the folling things
    for (const neighbour of neighbours) {
        const [nextRow,nextColumn,direction]=neighbour;
        // see if that neighbour is out of bounds
        if(nextRow<0||nextRow>=cellsVertical||nextColumn<0||nextColumn>=cellsHorizontal){
            continue;
        }
        // if we have visited that neighbour continue to next neighbour
        if(grid[nextRow][nextColumn]){
            continue;
        }
        // remove wall between those cells either from vericalWalls or horizentalWalls
        if(direction==='left'){
            verticalWalls[row][column-1]=true;
        }
        else if(direction==='right'){
            verticalWalls[row][column]=true;
        }
        else if(direction==='up'){
            horizontalWalls[row-1][column]=true;
        }
        else if(direction==='down'){
            horizontalWalls[row][column]=true;
        }
        // visit that next cell
        mazeGenerator(nextRow,nextColumn);
    }
}

mazeGenerator(startRow,startColumn);
// mazeGenerator(1,1);

// drawing maze walls using horizontalWalls array
horizontalWalls.forEach((row,rowIndex)=>{
    row.forEach((hWall,columnIndex)=>{
        if(hWall){
            return;
        }
        const wall=Bodies.rectangle(columnIndex*cellWidth+(cellWidth/2),
                                    rowIndex*cellHeight+cellHeight,
                                    cellWidth,mazeWallThickness,{
                                        isStatic:true,
                                        render:{
                                            fillStyle:'red'
                                        },
                                        label:'wall'
                                        
                                    });
        World.add(world,wall);
    });
});

// drawing maze walls using verticalWalls array
verticalWalls.forEach((row,rowIndex)=>{
    row.forEach((vWall,columnIndex)=>{
        if(vWall){
            return;
        }
        const wall=Bodies.rectangle(columnIndex*cellWidth+cellWidth,
                                    rowIndex*cellHeight+(cellHeight/2),
                                    mazeWallThickness,
                                    cellHeight,{
                                        isStatic:true,
                                        render:{
                                            fillStyle:'red'
                                        },
                                        label:'wall'
                                    });
        World.add(world,wall);
    });
});

// adding the goal rectangle
const goal=Bodies.rectangle(width-cellWidth/2,
    height-cellHeight/2,
    cellWidth*0.7,
    cellHeight*0.7,
    {
        isStatic:true,
        render:{
            fillStyle:'green'
        },
        label:'goal'
    });
World.add(world,goal);

// adding the playing Ball
const ball=Bodies.circle(cellWidth/2,
    cellHeight/2,
    Math.min(cellWidth,cellHeight)/3,{
        render:{
            fillStyle:'blue',
            
        },
        label:'ball'
    });
World.add(world,ball);

// Event Listeners for key presses
window.addEventListener('keydown',(event)=>{
    const {x,y}=ball.velocity;
    if(event.keyCode===87||event.keyCode===38){
        
        console.log('move up');
        Body.setVelocity(ball,{x,y:y-5});
    }
    if(event.keyCode===83||event.keyCode===40){
        console.log('move down');
        Body.setVelocity(ball,{x,y:y+5});
    }
    if(event.keyCode===65||event.keyCode===37){
        console.log('move left');
        Body.setVelocity(ball,{x:x-5,y});
    }
    if(event.keyCode===68||event.keyCode===39){
        console.log('move right');
        Body.setVelocity(ball,{x:x+5,y});
    }
});

// Win Condition
Events.on(engine,'collisionStart',(event)=>{
    event.pairs.forEach((collision)=>{
        const labels=['ball','goal'];
        if(labels.includes(collision.bodyA.label)&&
            labels.includes(collision.bodyB.label)){
                console.log('you won!!!');
                world.gravity.y=1;
                world.bodies.forEach((body)=>{
                    if(body.label==='wall'){
                        Body.setStatic(body,false);
                    }
                document.querySelector('.winMessage').classList.remove('hidden');
                document.querySelector('#gameWinSound').play();
                });
        }
    });

});

document.querySelector('#refresh').addEventListener('click',(e)=>{
    window.location.reload();
})
window.addEventListener('load',()=>{
    if(window.innerWidth<600){
        document.querySelector('.buttons').classList.remove('hidden');
    }
});

document.querySelectorAll('.buttons button i').forEach(function(button){
	button.addEventListener('click',function(e){
        console.log(e.target.id);
        const {x,y}=ball.velocity;
        if(e.target.id==='ArrowUp'){
            
            console.log('move up');
            Body.setVelocity(ball,{x,y:y-5});
        }
        if(e.target.id==='ArrowDown'){
            console.log('move down');
            Body.setVelocity(ball,{x,y:y+5});
        }
        if(e.target.id==='ArrowLeft'){
            console.log('move left');
            Body.setVelocity(ball,{x:x-5,y});
        }
        if(e.target.id==='ArrowRight'){
            console.log('move right');
            Body.setVelocity(ball,{x:x+5,y});
        }
		
	});
});