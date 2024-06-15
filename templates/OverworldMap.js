class OverworldMap {
  constructor(config) {
    this.overworld = null;
    this.gameObjects = config.gameObjects;
    this.cutsceneSpaces = config.cutsceneSpaces || {};
    this.walls = config.walls || {};

    this.lowerImage = new Image();
    this.lowerImage.src = config.lowerSrc;

    this.upperImage = new Image();
    this.upperImage.src = config.upperSrc;

    this.isCutscenePlaying = false;    
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage, 
      utils.withGrid(10.5) - cameraPerson.x, 
      utils.withGrid(6) - cameraPerson.y
      )
  }

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage, 
      utils.withGrid(10.5) - cameraPerson.x, 
      utils.withGrid(6) - cameraPerson.y
    )
  } 

  isSpaceTaken(currentX, currentY, direction) {
    const {x,y} = utils.nextPosition(currentX, currentY, direction);
    return this.walls[`${x},${y}`] || false;
  }

  mountObjects() {
    Object.keys(this.gameObjects).forEach(key => {

      let object = this.gameObjects[key];
      object.id = key;

      //TODO: determine if this object should actually mount
      object.mount(this);

    })
  }

  async startCutscene(events) {
    this.isCutscenePlaying = true;

    for (let i=0; i<events.length; i++) {
      const eventHandler = new OverworldEvent({
        event: events[i],
        map: this,
      })
      await eventHandler.init();
    }

    this.isCutscenePlaying = false;

    //Reset NPCs to do their idle behavior
    Object.values(this.gameObjects).forEach(object => object.doBehaviorEvent(this))
  }

  checkForActionCutscene() {
    const hero = this.gameObjects["hero"];
    const nextCoords = utils.nextPosition(hero.x, hero.y, hero.direction);
    const match = Object.values(this.gameObjects).find(object => {
      return `${object.x},${object.y}` === `${nextCoords.x},${nextCoords.y}`
    });
    if (!this.isCutscenePlaying && match && match.talking.length) {

      const relevantScenario = match.talking.find(scenario => {
        return (scenario.required || []).every(sf => {
          return playerState.storyFlags[sf]
        })
      })

      relevantScenario && this.startCutscene(relevantScenario.events)
    }
  }

  // // //working single entry
  checkForFootstepCutscene() {
    const hero = this.gameObjects["hero"];
    const match = this.cutsceneSpaces[ `${hero.x},${hero.y}` ];
    if (!this.isCutscenePlaying && match) {
      this.startCutscene( match[0].events )
    }
  }

  addWall(x,y) {
    this.walls[`${x},${y}`] = true;
  }
  removeWall(x,y) {
    delete this.walls[`${x},${y}`]
  }
  moveWall(wasX, wasY, direction) {
    this.removeWall(wasX, wasY);
    const {x,y} = utils.nextPosition(wasX, wasY, direction);
    this.addWall(x,y);
  }

}

window.OverworldMaps = {
  DemoRoom: {
    lowerSrc: "/templates/images/maps/DemoLower.png",
    upperSrc: "/templates/images/maps/DemoUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(6),
      }),
      npcA: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(9),
        src: "/templates/images/characters/people/npc1.png",
        behaviorLoop: [
          { type: "stand",  direction: "left", time: 800 },
          { type: "stand",  direction: "up", time: 800 },
          { type: "stand",  direction: "right", time: 1200 },
          { type: "stand",  direction: "up", time: 300 },
        ],
        talking: [
          {   
            required: ["LAB_ACCESSED"],         
            events: [
              { type: "textMessage", text: "Anna: The end is comming. RUN for your files!", faceHero: "npcA" },
            ]
          },          
          {
            required: ["TALKED_TO_MANAGER"],
            events: [
              { type: "textMessage", text: "Anna: OK run down to the lab and do your things!", faceHero: "npcA" },
              { type: "textMessage", text: "Anna: Tell Eric that the Manager told you to go there!", faceHero: "npcA" },
            ]
          },
          {
            required: ["TALKED_TO_ERIC"],
            events: [
              { type: "textMessage", text: "Anna: Eric said to talk to the manager...", faceHero: "npcA" },
              { type: "textMessage", text: "Anna: Go, He is next door expecting you!", faceHero: "npcA" },
            ]
          },
          {            
            events: [
              { type: "textMessage", text: "Anna: I'm busy...Talk to Eric!", faceHero: "npcA" },
              { type: "textMessage", text: "Anna: Go away!"},
              { who: "hero", type: "walk",  direction: "up" },
            ]
          },          
        ]
      }),
      npcB: new Person({
        x: utils.withGrid(7),
        y: utils.withGrid(5),
        src: "/templates/images/characters/people/npc2.png",
        // behaviorLoop: [
        //   { type: "walk",  direction: "left" },
        //   { type: "stand",  direction: "up", time: 800 },
        //   { type: "walk",  direction: "up" },
        //   { type: "walk",  direction: "right" },
        //   { type: "walk",  direction: "down" },
        // ]
        talking: [  
          {   
            required: ["LAB_ACCESSED"],         
            events: [
              { type: "textMessage", text: "Eric: Good Luck m8!", faceHero: "npcB" },
            ]
          },  
          {
            required: ["TALKED_TO_MANAGER"],
            events: [
              { type: "textMessage", text: "Hero: Eric! I spoke to the Manager...", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: And...?", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: He told me to have access to the server!", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: So you spoke to the Manager...", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: Ok, you'll see 3 desktops down there.", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: The first one will open you a panel!", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: the second one will open you the action that you can do with the DB!", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: And the 3rd one will print you the files that the manager will ask you", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Wouldnt that effect the whole App?", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: Actually no! The App is being partially controlling this game", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: The guy who programmed us didn't had all the time to fix everything", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: And one final thing, You'll need the SSP!", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: SSP?", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: The Super Secret Password to access the panel!", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: Its 'admin', '123' so keep it secret ok?", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: No wander the backdoors....!", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: Any questions?", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: All good!", faceHero: "npcB" },
              { type: "textMessage", text: "Eric: Ok let me unlock the door to the lab", faceHero: "npcB" },
              { who: "npcB", type: "walk",  direction: "up" },
              { who: "npcB", type: "stand",  direction: "up", time: 500 },
              //{ type: "textMessage", text:"You can't be in there!"},
              { who: "npcB", type: "walk",  direction: "down" },
              { who: "npcB", type: "walk",  direction: "right" },
              { who: "npcB", type: "stand",  direction: "left" },              
            ]
          },       
          {            
            events: [
              { type: "textMessage", text: "Eric: I'm busy...talk to the manager", faceHero: "npcB" },
              { type: "textMessage", text: "Move along!"},
              { who: "hero", type: "walk",  direction: "left" },
              { type: "addStoryFlag", flag: "TALKED_TO_ERIC"}
            ]
          },          
        ]
      }),
      Book1: new Person({
        x: utils.withGrid(4),
        y: utils.withGrid(3),
        src: "./templates/images/characters/PC.png",
        talking: [
          {                     
            events: [
              { type: "textMessage", text: "How to Bake your Code"},
              { type: "textMessage", text: "Once upon a byte in a land of algorithms and bits, there lived a curious programmer named Ada."},
              { type: "textMessage", text: "Ada loved coding, but one day she wanted to mix things up and decided to bake something special: a batch of Code Cookies!"},
              { type: "textMessage", text: "She opened her cookbook, 'The Art of Baking Code', and read the first recipe:"},
              { type: "textMessage", text: "Ingredients:"},
              { type: "textMessage", text: "1 cup of Syntax Sugar"},
              { type: "textMessage", text: "2 tablespoons of Logic Butter"},
              { type: "textMessage", text: "1 teaspoon of Debugging Powder"},
              { type: "textMessage", text: "2 fresh loops"},
              { type: "textMessage", text: "1/2 cup of Variable Vanilla Extract"},
              { type: "textMessage", text: "1 pinch of Compiler Salt"},
              { type: "textMessage", text: "A handful of Conditional Statements"},
              { type: "textMessage", text: "Instructions:"},
              { type: "textMessage", text: "1. Preheat Your IDE: Set your Integrated Development Environment to 350 MHz."},
              { type: "textMessage", text: "2. Prepare the Base:"},
              { type: "textMessage", text: "Ada took her favorite mixing bowl and added a cup of Syntax Sugar. She knew this would make her code sweet and readable."},
              { type: "textMessage", text: "She then creamed in the Logic Butter, making sure to avoid any illogical lumps."},
              { type: "textMessage", text: "'Smooth logic makes the best code cookies,' she said to her cat, Byte."},
              { type: "textMessage", text: "3. Add Algorithm Flour:"},
              { type: "textMessage", text: "Next, she gradually folded in the Algorithm Flour. It was important to do this carefully to avoid any algorithmic clumps."},
              { type: "textMessage", text: "Byte watched intently, occasionally pawing at the flying flour."},
              { type: "textMessage", text: "4. Debugging Powder:"},
              { type: "textMessage", text: "Ada sprinkled in a teaspoon of Debugging Powder. 'This should catch any bugs before they crawl into the cookies,' she thought. "},
              { type: "textMessage", text: "Debugging Powder was known to be quite potent, often saving many a baker from disastrous errors."},              
              { type: "textMessage", text: "5. Loops:"},
              { type: "textMessage", text: "She cracked open two fresh loops and whisked them into the mixture. 'Loops help everything come together nicely,' Ada mused,"},
              { type: "textMessage", text: "remembering the countless times her loops had saved her from repetitive strain."},
              { type: "textMessage", text: "6. Variable Vanilla Extract:"},
              { type: "textMessage", text: "She poured in half a cup of Variable Vanilla Extract, a special ingredient that gave each cookie its unique flavor."},
              { type: "textMessage", text: "'Variables always add that personal touch,' she said, smiling."},
              { type: "textMessage", text: "7. Compiler Salt:"},
              { type: "textMessage", text: "Ada added just a pinch of Compiler Salt to keep things in balance. Too much, and the cookies would crash;"},
              { type: "textMessage", text: "too little, and they'd be bland and unresponsive."},
              { type: "textMessage", text: "8. Conditional Statements:"},
              { type: "textMessage", text: "Lastly, she threw in a handful of Conditional Statements, ensuring the cookies would adapt to any environment."},
              { type: "textMessage", text: "Byte meowed approvingly."},
              { type: "textMessage", text: "Ada carefully poured the mixture onto a baking sheet, ensuring each cookie was spaced properly to prevent any merge conflicts. "},
              { type: "textMessage", text: "She slid the tray into the preheated IDE and set the timer."},
              { type: "textMessage", text: "As the cookies baked, the kitchen filled with the warm aroma of well-structured code. Ada couldn't wait to taste the final product."},
              { type: "textMessage", text: "When the timer beeped, she pulled out the tray and admired her golden-brown Code Cookies, each one perfectly compiled."},
              { type: "textMessage", text: "She took a bite."},
              { type: "textMessage", text: "It was a symphony of flavors, a seamless integration of sweet syntax, buttery logic, and a hint of vanilla variables."},
              { type: "textMessage", text: "Even Byte got a nibble and purred with delight."},
              { type: "textMessage", text: "And so, Ada's Code Cookies became the talk of the programming community."},
              { type: "textMessage", text: "Programmers from all over came to get the recipe, and Ada's kitchen was forever filled with the delicious aroma of freshly baked code."},
              { type: "textMessage", text: "She had discovered the perfect blend of baking and programming, proving once and for all that great code is..."},
              { type: "textMessage", text: "...a piece of cake!"},        
            ]
          },  
        ]
      }),
      Book2: new Person({
        x: utils.withGrid(3),
        y: utils.withGrid(3),
        src: "./templates/images/characters/PC.png",
        talking: [
          {                     
            events: [
              { type: "textMessage", text: "The Legend of Pizza Programmarita: A Culinary Coding Adventure"},
              { type: "textMessage", text: "In the bustling city of Technopolis, where servers hummed and data packets zoomed like delivery scooters,"},
              { type: "textMessage", text: "there lived a quirky programmer named Linus. One day, Linus decided he wanted to create the ultimate masterpiece:"},
              { type: "textMessage", text: "the Pizza Programmarita."},
              { type: "textMessage", text: "He pulled out his trusty recipe book, 'The Culinary Code Compendium,' and flipped to the chapter on pizza."},
              { type: "textMessage", text: "The page read:"},
              { type: "textMessage", text: "Ingredients:"},
              { type: "textMessage", text: "1. 1 GitHub repository of Dough Code"},
              { type: "textMessage", text: "2. 2 cups of Variable Tomato Sauce"},
              { type: "textMessage", text: "3. 3 arrays of Cheese Bits"},
              { type: "textMessage", text: "4. 1 loop of Pepperoni"},
              { type: "textMessage", text: "5. 1 class of Vegetables (encapsulated)"},
              { type: "textMessage", text: "6. 1 sprinkle of Algorithmic Oregano"},
              { type: "textMessage", text: "7. 1 function of Olive Oil"},
              { type: "textMessage", text: "Instructions:"},
              { type: "textMessage", text: "1. Initialize the Dough:"},
              { type: "textMessage", text: "Linus cloned the Dough Code repository from GitHub. 'git clone https://github.com/pizza/dough-code.git,' he typed with a flourish."},
              { type: "textMessage", text: "As the dough downloaded, he commented to his turtle pet,"},
              { type: "textMessage", text: "Usb,'No pizza can start without a solid base class.'"},
              { type: "textMessage", text: "2. Create the Sauce:"},
              { type: "textMessage", text: "He instantiated 2 cups of Variable Tomato Sauce, carefully balancing the acidity and sweetness."},
              { type: "textMessage", text: "'This sauce will hold everything together, just like good variable names,' he muttered, stirring vigorously."},
              { type: "textMessage", text: "3. Add Cheese Bits:"},
              { type: "textMessage", text: "Linus then added 3 arrays of Cheese Bits, ensuring an even distribution."},
              { type: "textMessage", text: "'Cheese is like data: too little, and it's bland; too much, and it overloads the system.'"},
              { type: "textMessage", text: "4. Loop in the Pepperoni:"},
              { type: "textMessage", text: "Next, he created a loop for the pepperoni. 'for (int i = 0; i < pepperoni.count; i++),' he coded,"},
              { type: "textMessage", text: "placing a slice in a perfect spiral. 'Loops always make things repetitive but tasty,' he chuckled."},
              { type: "textMessage", text: "5. Encapsulate the Vegetables:"},
              { type: "textMessage", text: "He then encapsulated an array of vegetables into a class called VegetableToppings. "},
              { type: "textMessage", text: "'Encapsulation keeps everything neat and modular,' he explained to Usb, who was more interested in the smell than the logic."},
              { type: "textMessage", text: "6. Sprinkle Algorithmic Oregano:"},
              { type: "textMessage", text: "Linus finished with a sprinkle of Algorithmic Oregano."},
              { type: "textMessage", text: "'This will optimize the flavor complexity,' he said, feeling like a true code connoisseur."},
              { type: "textMessage", text: "7. Function of Olive Oil:"},
              { type: "textMessage", text: "Finally, he wrote a function of Olive Oil to drizzle over the pizza."},
              { type: "textMessage", text: "'void drizzleOliveOil() { pour oliveOil(); },' he typed, executing it with a flick of his wrist."},
              { type: "textMessage", text: "Linus then preheated his Code Oven, a custom-built contraption powered by an overclocked CPU, to 450 MHz."},
              { type: "textMessage", text: "He carefully slid the pizza into the oven and set a timer."},
              { type: "textMessage", text: "As the pizza baked, the kitchen filled with a mouthwatering aroma of freshly compiled code and perfectly integrated toppings."},
              { type: "textMessage", text: "USB paced back and forth, clearly eager to taste the culinary creation."},
              { type: "textMessage", text: "When the timer beeped, Linus pulled out the Pizza Programmarita, its crust golden and cheese bubbling. "},
              { type: "textMessage", text: "He cut a slice, took a bite, and savored the harmonious blend of flavors. 'This,' he declared to Usb,"},
              { type: "textMessage", text: "'is the pinnacle of edible algorithms.'"},
              { type: "textMessage", text: "Word of Linus's creation spread throughout Technopolis. Programmers from all over the city queued up to taste his Pizza Programmarita."},
              { type: "textMessage", text: "It became the de facto snack for late-night coding sessions, fueling countless lines of code and bug fixes."},
              { type: "textMessage", text: "Linus had proven that with the right blend of culinary and coding skills, you could create something truly extraordinary. "},
              { type: "textMessage", text: "And thus, the Pizza Programmarita became a legendary dish, celebrated by coders and foodies alike....."},
              { type: "textMessage", text: "...The end."},

            ]
          },
        ]
      }),
    },
    walls: { // fixing the boundaries
      [utils.asGridCoord(7,6)] : true,
      [utils.asGridCoord(8,6)] : true,
      [utils.asGridCoord(7,7)] : true,
      [utils.asGridCoord(8,7)] : true,
      [utils.asGridCoord(1,3)] : true,
      [utils.asGridCoord(2,3)] : true,
      [utils.asGridCoord(3,3)] : true,
      [utils.asGridCoord(4,3)] : true,
      [utils.asGridCoord(5,3)] : true,
      [utils.asGridCoord(6,4)] : true,
      [utils.asGridCoord(8,4)] : true,
      [utils.asGridCoord(9,3)] : true,
      [utils.asGridCoord(10,3)] : true,
      [utils.asGridCoord(11,4)] : true,
      [utils.asGridCoord(11,5)] : true,
      [utils.asGridCoord(11,6)] : true,
      [utils.asGridCoord(11,7)] : true,
      [utils.asGridCoord(11,8)] : true,
      [utils.asGridCoord(11,9)] : true,
      [utils.asGridCoord(11,10)] : true,
      [utils.asGridCoord(10,10)] : true,
      [utils.asGridCoord(9,10)] : true,
      [utils.asGridCoord(8,10)] : true,
      [utils.asGridCoord(7,10)] : true,
      [utils.asGridCoord(6,10)] : true,
      [utils.asGridCoord(5,11)] : true,
      [utils.asGridCoord(4,10)] : true,
      [utils.asGridCoord(3,10)] : true,
      [utils.asGridCoord(2,10)] : true,
      [utils.asGridCoord(1,10)] : true,
      [utils.asGridCoord(0,4)] : true,
      [utils.asGridCoord(0,5)] : true,
      [utils.asGridCoord(0,6)] : true,
      [utils.asGridCoord(0,7)] : true,
      [utils.asGridCoord(0,8)] : true,
      [utils.asGridCoord(0,9)] : true,
      [utils.asGridCoord(0,10)] : true,
    },    
    cutsceneSpaces: {
      [utils.asGridCoord(7,3)]: [
        {
          events: [
            { type: "changeMap", map: "Lab" }, 
            { type: "addStoryFlag", flag: "LAB_ACCESSED"},           
          ]
        }
      ],
      [utils.asGridCoord(5,10)]: [
        {          
          events: [
            { type: "changeMap", map: "Kitchen" }
          ]
        }
      ]
    }
    
  },
  Kitchen: {
    lowerSrc: "/templates/images/maps/KitchenLower.png",
    upperSrc: "/templates/images/maps/KitchenUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(5),
        y: utils.withGrid(9),
      }),
      npcB: new Person({
        x: utils.withGrid(10),
        y: utils.withGrid(8),
        src: "/templates/images/characters/people/npc3.png",
        talking: [
          {   
            required: ["END"],         
            events: [
              { type: "textMessage", text: "Hero: Here's the file Chef?", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: Yes!, Everything looks good!", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: First of all,thank you for saving the bussines", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: As you can understand we can start again to bake pizzas for our Dev clients", faceHero: "npcB" },              
              { type: "textMessage", text: "Manager: And by the way now that you are among us feel free to look around", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: and dont forget you can stil have access to the server room", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Roger-Roger!", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: Dont print any more files! The game is Over", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Roger-Roger!", faceHero: "npcB" },
              {who: "npcB", type: "stand", direction: "up"},
              { type: "addStoryFlag", flag: "Finish"},
            ]
          },
          {   
            required: ["EMPTYLIST"],         
            events: [
              { type: "textMessage", text: "Manager: Did you clean the Database?", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Yes!, Here is the file!", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: Hmmmmmm...Nice!", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: Everything looks good and clean.", faceHero: "npcB" },              
              { type: "textMessage", text: "Manager: Ok! Now go down again and create our accounts in order to have access,", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: and let us hope that this wont happen again!", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Roger-Roger!", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: Dont forget to print the file!", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Roger-Roger!", faceHero: "npcB" },
              {who: "npcB", type: "stand", direction: "up"},
              { type: "addStoryFlag", flag: "CREATE"},
            ]
          },
          {   
            required: ["FILES"],         
            events: [
              { type: "textMessage", text: "Manager: Did you brought the  file?", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Here!", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: Hmmmmmm....!", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: Emmmmm!", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Well?", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: The only solution i can thing is to go down and delete the list....use the id to do it and dont forget to print again the file!", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: I want to see that everything is clean!", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Got it! Am on it!", faceHero: "npcB" },
              {who: "npcB", type: "stand", direction: "up"},
              { type: "addStoryFlag", flag: "DELETE"},
            ]
          },
          {   
            required: ["LAB_ACCESSED"],         
            events: [
              { type: "textMessage", text: "Manager: Were are the files?", faceHero: "npcB" },
              { type: "textMessage", text: "Hero: Am on it!", faceHero: "npcB" },
              { type: "textMessage", text: "Manager: Dont stand there every minute counts", faceHero: "npcB" },
              {who: "npcB", type: "stand", direction: "up"},
            ]
          },  
          {
            required: ["TALKED_TO_ERIC"],
            events: [
              { type: "addStoryFlag", flag: "TALKED_TO_MANAGER"},       
              { type: "textMessage", text: 
              "Manager: Finally your here!", faceHero:"npcB" },
              { type: "textMessage", text: 
              "Manager: I need you to go down to the Lab and fix our...", faceHero:"npcB" },
              { type: "textMessage", text: 
              "Manager: Customers Support DataBase", faceHero:"npcB" },
              { type: "textMessage", text: 
              "Hero: What happend?", faceHero:"npcB" },
              { type: "textMessage", text: 
              "Manager: Our rivals managed to hire some vicious hackers...", faceHero:"npcB" },
              { type: "textMessage", text: 
              "Manager: They got them selfs into the Database...", faceHero:"npcB" },
              { type: "textMessage", text: 
              "Manager: I dont know how , but they managed to find access...", faceHero:"npcB" },
              { type: "textMessage", text: 
              "Manager: into the CSD and now they are spreading chaos by altering the data!", faceHero:"npcB" },
              { type: "textMessage", text: 
              "Hero: What do you want me to do?", faceHero:"npcB" },
              { type: "textMessage", text: 
              "Manager: Go down to the lab and print me a file of all the users who have access to the Database", faceHero:"npcB" }, 
              {who: "npcB", type: "stand", direction: "up"},                                  
            ]
          },                     
        ]     
      }),
    },
    walls: { // fixing the boundaries
      [utils.asGridCoord(9,9)] : true,
      [utils.asGridCoord(8,10)] : true,
      [utils.asGridCoord(7,10)] : true,
      [utils.asGridCoord(6,10)] : true,
      [utils.asGridCoord(4,10)] : true,
      [utils.asGridCoord(3,10)] : true, 
      [utils.asGridCoord(2,9)] : true,     
      [utils.asGridCoord(1,9)] : true,
      [utils.asGridCoord(0,8)] : true,
      [utils.asGridCoord(1,7)] : true,
      [utils.asGridCoord(1,6)] : true,
      [utils.asGridCoord(1,5)] : true,
      [utils.asGridCoord(0,4)] : true,
      [utils.asGridCoord(1,3)] : true,
      [utils.asGridCoord(2,3)] : true,
      [utils.asGridCoord(3,3)] : true,
      [utils.asGridCoord(4,3)] : true,
      [utils.asGridCoord(5,3)] : true,
      [utils.asGridCoord(6,3)] : true,
      [utils.asGridCoord(7,3)] : true,
      [utils.asGridCoord(8,3)] : true,
      [utils.asGridCoord(9,3)] : true,
      [utils.asGridCoord(10,3)] : true,
      [utils.asGridCoord(11,3)] : true,
      [utils.asGridCoord(11,4)] : true,
      [utils.asGridCoord(12,4)] : true,
      [utils.asGridCoord(13,5)] : true,
      [utils.asGridCoord(13,6)] : true,
      [utils.asGridCoord(13,7)] : true,
      [utils.asGridCoord(13,8)] : true,
      [utils.asGridCoord(13,9)] : true,
      [utils.asGridCoord(10,9)] : true,
      [utils.asGridCoord(12,10)] : true,
      [utils.asGridCoord(11,10)] : true,
      [utils.asGridCoord(10,7)] : true,
      [utils.asGridCoord(9,7)] : true,
      [utils.asGridCoord(7,7)] : true,
      [utils.asGridCoord(6,7)] : true,
    },    
    cutsceneSpaces:{
      [utils.asGridCoord(5,10)]: [
        {
          events: [
            { type: "changeMap", map: "DemoRoom" }
          ]
        }
      ],          
    }
  },
  Lab: {
    lowerSrc: "/templates/images/maps/DemoLower3.png",
    upperSrc: "/templates/images/maps/DemoUpper.png",
    gameObjects: {
      hero: new Person({
        isPlayerControlled: true,
        x: utils.withGrid(7),
        y: utils.withGrid(5),
      }),
      PC1: new Person({
        x: utils.withGrid(5),
        y: utils.withGrid(3),
        src: "./templates/images/characters/PC.png",
        talking: [
          {                     
            events: [
              { type: "textMessage", text: "BackEnd: The end is comming. RUN for your files!"},
              { type: "addPostStoryFlag", text:"Iframe1"},                            
            ]
          },  
        ]
      }),
      PC2: new Person({
        x: utils.withGrid(3),
        y: utils.withGrid(3),
        src: "./templates/images/characters/PC.png",
        talking: [
          {                             
            events: [
              { type: "textMessage", text: "FrontEnd: Why am always on the Front line of fire?"},
              { type: "addPostStoryFlag", text:"Iframe2"},                           
            ]
          },  
        ]
      }),
      PC3: new Person({
        x: utils.withGrid(2),
        y: utils.withGrid(3),
        src: "./templates/images/characters/PC.png",
        talking: [
          {    
            required: ["CREATE"],                 
            events: [
              { type: "addStoryFlag", flag: "END"},             
              { type: "textMessage", text: "HERO: Ok! We got the proof,lets get back!"}, 
              { type: "addPostStoryFlag", text:"Login"},                         
            ]
          },
          {    
            required: ["DELETE"],                 
            events: [
              { type: "addStoryFlag", flag: "EMPTYLIST"},             
              { type: "textMessage", text: "HERO: Ok! We got the proof,lets get back!"}, 
              { type: "addPostStoryFlag", text:"Login"},                         
            ]
          },
          {                         
            events: [
              { type: "addStoryFlag", flag: "FILES"},
              { type: "textMessage", text: "DB: The end is Near. Running out of files!But am going to print whatever is left in me!"},
              { type: "textMessage", text: "HERO: OK! I think this is what the manager was asking for! Lets go and speak to him!"}, 
              { type: "addPostStoryFlag", text:"Login"},                         
            ]
          },  
        ]
      }),
    },
    walls: { //fixing the boundaries
      [utils.asGridCoord(7,6)] : true,
      [utils.asGridCoord(8,6)] : true,
      [utils.asGridCoord(7,7)] : true,
      [utils.asGridCoord(8,7)] : true,
      [utils.asGridCoord(1,3)] : true,
      [utils.asGridCoord(2,3)] : true,
      [utils.asGridCoord(3,3)] : true,
      [utils.asGridCoord(4,3)] : true,
      [utils.asGridCoord(5,3)] : true,
      [utils.asGridCoord(6,4)] : true,
      [utils.asGridCoord(8,4)] : true,
      [utils.asGridCoord(9,3)] : true,
      [utils.asGridCoord(10,3)] : true,
      [utils.asGridCoord(11,4)] : true,
      [utils.asGridCoord(11,5)] : true,
      [utils.asGridCoord(11,6)] : true,
      [utils.asGridCoord(11,7)] : true,
      [utils.asGridCoord(11,8)] : true,
      [utils.asGridCoord(11,9)] : true,
      [utils.asGridCoord(11,10)] : true,
      [utils.asGridCoord(10,10)] : true,
      [utils.asGridCoord(9,10)] : true,
      [utils.asGridCoord(8,10)] : true,
      [utils.asGridCoord(7,10)] : true,
      [utils.asGridCoord(6,10)] : true,
      [utils.asGridCoord(5,10)] : true,
      [utils.asGridCoord(4,10)] : true,
      [utils.asGridCoord(3,10)] : true,
      [utils.asGridCoord(2,10)] : true,
      [utils.asGridCoord(1,10)] : true,
      [utils.asGridCoord(0,4)] : true,
      [utils.asGridCoord(0,5)] : true,
      [utils.asGridCoord(0,6)] : true,
      [utils.asGridCoord(0,7)] : true,
      [utils.asGridCoord(0,8)] : true,
      [utils.asGridCoord(0,9)] : true,
      [utils.asGridCoord(0,10)] : true,
    },
    cutsceneSpaces: {
      [utils.asGridCoord(7, 4)]: [
        {
          events: [
            { type: "changeMap", map: "DemoRoom" }
          ]
        }
      ],
    }
  }
} 