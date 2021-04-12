var jsGames = angular.module("jsGames");


jsGames.service('gameScreenService', function() {
    this.canvas = null;
    this.context = null;
    this.rects = [];
    this.labels = [];
    this.bgColor = '#ccc8c8';
    this.lastMousePos = {'x': 0, 'y': 0};
    this.setGameScreen = function(screen, width, height){
        if(this.gameScreen){
            throw "Already has a screen set!";
        }
        this.canvas = screen;
        this.canvas.height = height; this.canvas.width = width;
        this.context = screen.getContext('2d');
    };
    
    this.createLabel = function(x, y, text, color, size){   
        this.labels.push({'x': x, 'y': y, 'text': text, 'color': color,
                          'size': size});
    };

    this.createRect = function(x, y, width, height, color, id, onClick, border=false, hover=null){
        this.rects.push({'xMin': x, 'xMax': x+width, 'yMin': y, 'yMax': y+height, 'color': color, 'id': id, 'onClick': onClick,
                         'border': border, 'hover': hover, 'actualColor': color});
    };

    this.getRectsNum = function(){
        return this.rects.length;
    };

    this.removeRect = function(ind){
        if(ind>=this.rects.length){throw "Exceeds array";}
        this.rects[ind] = null;
    };

    this.removeLabel = function(ind){
        if(ind>=this.labels.length){throw "Exceeds array";}
        this.labels[ind] = null;
    };

    this.getLabelsNum = function(){
        return this.labels.length;
    };

    this.updateRect = function(ind, dict){
        for(let key in dict){
            this.rects[ind][key] = dict[key];
        }
        this.checkHover(this.lastMousePos.x, this.lastMousePos.y);
    };

    this.updateLabel = function(ind, dict){
        for(let key in dict){
            this.labels[ind][key] = dict[key];
        }
    };

    this.resetRects = function(){
        this.rects = [];
    };

    this.resetLabels = function(){
        this.labels = [];
    };

    this.setWidth = function(width){
        this.canvas.width = width;
    };

    this.setHeight = function(height){
        this.canvas.height = height;
    };

   this.getContext = function(){ //TODO: Maybe change to support drawing with pong.
       return this.context;
   };

    this.refresh = function(){
        let context = this.context; let canvas=this.canvas; let rects=this.rects;
        let labels = this.labels;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = this.bgColor;
        context.fillRect(0, 0, canvas.width, canvas.height);
        for(let ind=0;ind<rects.length;++ind){
            if(!rects[ind]){continue;}
            let x=rects[ind]['xMin']; let y=rects[ind]['yMin'];
            let width=rects[ind]['xMax']-x; let height=rects[ind]['yMax']-y;
            if(rects[ind].actualColor == null){
                throw "Color is undefined";
            }
            context.fillStyle = rects[ind].actualColor;
            context.fillRect(x, y, width, height);
            if(rects[ind]['border']){
                context.strokeStyle="rgba(0,0,0,1)";
                context.strokeRect(x,y,width,height);
            }
        }
        for(let ind=0;ind<labels.length;++ind){
            if(!labels[ind]){continue;}
            let x=labels[ind]['x']; let y=labels[ind]['y']; 
            let text=labels[ind]['text']; let color=labels[ind]['color'];
            let size = labels[ind]['size'];
            context.font = size + "px Arial";
            context.fillStyle = color;
            context.fillText(text, x, y); 
        }
    };
    this.getCursorPosition = function(event) {
        const rect = canvas.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        if(x<0 || x>this.canvas.width || y<0 || y>this.canvas.height){
            return null;
        }
        return {x: x, y: y}
    };

    this.checkCollisionWithRect = function(x, y, onCollision, onNoCollision){
        let rects = this.rects;
        for(let ind=0;ind<rects.length;++ind){
            if(!rects[ind]){continue;}
            let xMin = rects[ind]['xMin'];
            let xMax = rects[ind]['xMax'];
            let yMin = rects[ind]['yMin'];
            let yMax = rects[ind]['yMax'];
            if(xMin<=x && x<=xMax && yMin<=y && y<=yMax){
                onCollision(rects[ind]);
            }else{
                onNoCollision(rects[ind]);
            }
        }
    };

    this.checkClick = function(x, y){
        this.checkCollisionWithRect(x, y, (rect)=>{rect.onClick();}, (rect)=>{});
    };

    this.checkHover = function(x, y){
        this.checkCollisionWithRect(x, y, (rect)=>{
            if(rect.hover){rect.actualColor = rect.hover;}
        }, (rect)=>{rect.actualColor = rect.color;});
    };

    this.mousedown = function(e){
        let coords = this.getCursorPosition(e);
        if(coords!=null){
            let x = coords['x'];
            let y = coords['y'];
            this.checkClick(x, y);
        }
        this.refresh();
    };

    this.mousemove = function(e){
        let coords = this.getCursorPosition(e);
        if(coords!=null){
            let x = coords['x'];
            let y = coords['y'];
            this.lastMousePos.x = x; this.lastMousePos.y = y;
            this.checkHover(x, y);
            this.refresh();
        }
    };
});

jsGames.directive("gameScreen", ['gameScreenService', function(gameScreenService) {
    return {
        scope:{
            width: "=",
            height: "=",
        },
        link: function(scope, element, attr){
            gameScreenService.setGameScreen(element[0], attr.width, attr.height);
            element.bind('mousedown', (e)=>{gameScreenService.mousedown(e);});
            element.bind('mousemove', (e)=>{gameScreenService.mousemove(e);});
        }
    };
  }]);