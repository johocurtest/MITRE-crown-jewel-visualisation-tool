import { Component, HostListener, ElementRef, ViewChild } from "@angular/core";
import { constants } from "buffer";
import { DomSanitizer } from "@angular/platform-browser";
declare var LeaderLine;
@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
  host: {
    "(document:keypress)": "handleKeyPress($event)",
  },
})
export class HomePage {
  @ViewChild("uploader", { static: false }) uploader: ElementRef;

  //@HostListener('document:keypress', ['$event'])
  rows: Array<IRow> = [];
  connections: Array<IConnection> = [];
  rowIdCounter = 0;
  nodeIdCounter = 0;
  drawing = false;
  startNode;
  endNode;
  connectorState = "nomi";
  isTyping = false;
  keysClicked = [];

  constructor(private sanitizer: DomSanitizer) {}

  async ionViewDidEnter() {
    await this.timeout(300);
    this.addRow();
    await this.timeout(300);
    this.addRow();
    await this.timeout(300);
    this.addRow();
    await this.timeout(300);
    this.addRow();
    await this.timeout(300);
    this.addNode(this.rows[0]);
    await this.timeout(500);
    this.addNode(this.rows[1]);
    await this.timeout(500);
    this.addNode(this.rows[1]);

    //rename rows
    this.rows[0].name="Mission Objectives";
    this.rows[1].name="Operational Tasks";
    this.rows[2].name="Infromation Assets";
    this.rows[3].name="Cyber Assets";
  }

  addRow() {
    console.log("adding new row");
    let newRow: IRow = {
      id: this.rowIdCounter,
      name: "row" + this.rowIdCounter,
      nodes: [],
    };
    this.rows.push(newRow);
    this.rowIdCounter++;
    
    console.log("rows:", this.rows.length);
   
  }

  // drop(row: IRow, e: CdkDragDrop<string[]>) {
  //   console.log("", e);
  //   moveItemInArray(row.nodes, e.previousIndex, e.currentIndex);
  //   //this.reposition();
  // }

  moveUpInArray(node:INode,row:IRow){
    //first get the index of the node we want to move
    let nodeIndex = row.nodes.findIndex((x) => x.id == node.id);
    //Just check to make sure the node is within bounds
    if(nodeIndex!==row.nodes.length-1){
      row.nodes[nodeIndex]=row.nodes[nodeIndex+1];
      row.nodes[nodeIndex+1]=node;
      this.reposition();
    }
    //Else, do nothing
    else{
      console.log("already at the end, nothing to move")
    }
  }

  moveDownInArray(node:INode,row:IRow){
    //first get the index of the node we want to move
    let nodeIndex = row.nodes.findIndex((x) => x.id == node.id);
    //Just check to make sure the node is within bounds
    if(nodeIndex!==0){
      row.nodes[nodeIndex]=row.nodes[nodeIndex-1];
      row.nodes[nodeIndex-1]=node;
      this.reposition();
    }
    //Else, do nothing
    else{
      console.log("already at the end, nothing to move")
    }
  }

  addNode(row) {
    console.log("creating node");
    let newNode: INode = {
      id: "node" + this.nodeIdCounter,
      name: "node" + this.nodeIdCounter,
      connections: [],
      clicked: false,
      
    };
    this.rows.find((x) => x.id == row.id).nodes.push(newNode);
    this.nodeIdCounter++;
    console.log("row " + row.name + " has " + row.nodes.length + " nodes.");
    this.reposition();
    
  }

  handleKeyPress(event: any) {
    // Don't do anything will focused and typing
    if (event.srcElement.nodeName === "BODY") {
      console.log("Event", event);
      let key = event.key.toLocaleLowerCase();
      console.log(key);
      switch (event.key) {
        case "s":
          this.saveState();
          break;
        case "q": //stop node connect
          this.drawing = false;
          this.startNode = null;
          break;
        case "h": //hide connections
          this.hideConnections();
          break;
        case "a": //show connections
          this.showAllConnections();
          break;
        case "i":
          this.uploader.nativeElement.click();
          break;
        case "1": //failure
          this.connectorState = "fail";
          break;
        case "2": //degraded
          this.connectorState = "degr";
          break;
        case "3": //work around
          this.connectorState = "work";
          break;
        case "4": //nominal
          this.connectorState = "nomi";
          break;
      }
    }
  }

  removeNode(row, node) {
    //remove node from row
    let nodeIndex = row.nodes.findIndex((x) => x.id == node.id);
    row.nodes.splice(nodeIndex, 1);
    //remove any connections assocaited with that node
    this.connections.forEach((conn, i) => {
      if (conn.origin === node.id || conn.destination === node.id) {
        conn.line.remove();
        this.connections.splice(i, 1);
      }
    });
    this.reposition();
  }

  hideConnections() {
    this.connections.forEach((conn) => {
      console.log("hiding", conn);
      conn.line.hide("fade", { duration: 200, timing: "linear" });
    });
  }

  showAllConnections() {
    this.connections.forEach((conn) => {
      conn.line.show("fade", { duration: 200, timing: "linear" });
    });
  }

  async showConnections(nodeId) {
    console.log("showing connections from origin: " + nodeId);
    await this.timeout(100);
    this.connections.forEach((conn) => {
      //If the connections exist on the bas node
      if (conn.origin === nodeId) {
        console.log("showing: ", conn);
        conn.line.show("draw", { duration: 100, timing: "linear" });
        //and show the connections of the destination node aswell
        this.showConnections(conn.destination);
      }
    });
  }

  drawLine(startNode?, endNode?,state?) {
    let start = startNode ? startNode : this.startNode;
    let end = endNode ? endNode : this.endNode;
    let lineColor = state? this.getColorBasedOnState(state) : this.getColorBasedOnState();
    let myLine = new LeaderLine(
      document.getElementById(start),
      document.getElementById(end),
      { color: lineColor }
    );
    this.connections.push({
      origin: start,
      destination: end,
      line: myLine,
      state:  state? state:this.connectorState,
    });
  }

  getColorBasedOnState(state?) {
    if (state) {
      switch (state) {
        case "fail": //failure
          return "#870c0c";
        case "degr": //degraded
          return "#da9809";
        case "work": //work around
          return "#1dd317";
        case "nomi": //nominal
          return "#FFFFFF";
      }
    }
    switch (this.connectorState) {
      case "fail": //failure
        return "#870c0c";
      case "degr": //degraded
        return "#da9809";
      case "work": //work around
        return "#1dd317";
      case "nomi": //nominal
        return "#FFFFFF";
    }
  }

  async reposition() {
    
    console.log("repositioning");
    await this.timeout(100);
    this.connections.forEach((conn, i) => {
      conn.line.remove();
      let myLine = new LeaderLine(
        document.getElementById(conn.origin),
        document.getElementById(conn.destination),
        { 
          color: this.getColorBasedOnState(conn.state) 
        }
      );
      conn.line = myLine;
    });
    this.hideConnections();
  }

  startDrawing(node) {
    this.showConnections(node);
    this.drawing = true;
    this.startNode = node.id;
    console.log("drawing from:", node.name);
  }

  endDrawing(node) {
    console.log("to:", node.name);
    this.endNode = node.id;
    this.drawing = false;
    this.drawLine();
  }

  timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  url;
  saveState() {
    let data = JSON.stringify({
      rows: this.rows,
      connections: this.connections,
    });
    console.log(data);
    const blob = new Blob([data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    this.url = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    //
    const dwldLink = document.createElement("a");

    if (
      navigator.userAgent.indexOf("Safari") !== -1 &&
      navigator.userAgent.indexOf("Chrome") === -1
    ) {
      dwldLink.setAttribute("target", "_blank");
    }
    dwldLink.setAttribute("href", url);
    dwldLink.setAttribute("download", "jump-crown-map-data.json");
    dwldLink.style.visibility = "hidden";
    document.body.appendChild(dwldLink);
    dwldLink.click();
    document.body.removeChild(dwldLink);
    this.reposition();
  }

  public importFile(event) {
    // const reader = new FileReader();
    // reader.onload = (e: any) => {
    //   console.log(JSON.parse(e));
    // };
    // reader.read
    // reader.(event.target.files[0])
    this.importTHAFile(event);
  }

  json;
  importTHAFile(evt) {
    var files = evt.target.files;
    var reader = new FileReader();
    reader.onload = (e: any) => {
      console.log("e readAsText = ", e);
      console.log("e readAsText target = ", e.target);
      try {
        this.json = JSON.parse(e.target.result);
        this.rows.forEach((x) => {
          this.nodeIdCounter += x.nodes.length;
          this.rowIdCounter++;
        });
        //Set the rows
        this.rows = this.json.rows;
        //draw the lines
        this.json.connections.forEach(async (con) => {
          await this.timeout(500);
          this.drawLine(con.origin, con.destination, con.state);
        });
        //this.showAllConnections();
        this.reposition();
      } catch (ex) {
        alert("ex when trying to parse json = " + ex);
      }
    };
    reader.readAsText(files[0]);
  }
}

export interface INode {
  id: string;
  name: string;
  connections: Array<number>;
  clicked: boolean;
}

export interface IRow {
  id: number;
  name: string;
  nodes: Array<INode>;
}

export interface IConnection {
  origin: string;
  destination: string;
  line: any;
  state: string;
}
