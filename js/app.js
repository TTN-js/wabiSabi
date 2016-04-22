// es5, 6, and 7 polyfills, powered by babel
import polyfill from "babel-polyfill"

//
// fetch method, returns es6 promises
// if you uncomment 'universal-utils' below, you can comment out this line
import fetch from "isomorphic-fetch"

// universal utils: cache, fetch, store, resource, fetcher, router, vdom, etc
// import * as u from 'universal-utils'

// the following line, if uncommented, will enable browserify to push
// a changed fn to you, with source maps (reverse map from compiled
// code line # to source code line #), in realtime via websockets
// -- browserify-hmr having install issues right now
// if (module.hot) {
//     module.hot.accept()
//     module.hot.dispose(() => {
//         app()
//     })
// }

// Check for ServiceWorker support before trying to install it
// if ('serviceWorker' in navigator) {
//     navigator.serviceWorker.register('./serviceworker.js').then(() => {
//         // Registration was successful
//         console.info('registration success')
//     }).catch(() => {
//         console.error('registration failed')
//             // Registration failed
//     })
// } else {
//     // No ServiceWorker Support
// }

import DOM from 'react-dom'
import React, {Component} from 'react'

import $ from "jquery"
import _ from "underscore"
import Firebase from "firebase"
import Backbonefire from "bbfire"

var fbRef = new Firebase("https://wabisabi.firebaseio.com/")

// //models

var UserModel = Backbonefire.Firebase.Model.extend({

	initialize:function(uid){
		this.url =`https://wabisabi.firebaseio.com/users/${uid}`
	}
})

var QueryGarmentsByUID = Backbonefire.Firebase.Collection.extend({
	autoSync: false,
	initialize: function(targetId){
		this.url = ref.child('garments').orderByChild('uid').equalTo(targetId) // child garment node for this uid
	}
})

var GarmentsCollection = Backbonefire.Firebase.Collection.extend({ //1) create collection
	initialize:function(){
		this.url = `https://wabisabi.firebaseio.com/garments`
	}
})

var SwapsCollection = Backbonefire.Firebase.Collection.extend({
	initialize:function(){
		this.url = `https://wabisabi.firebaseio.com/swaps`
	}
})

var QuerySwapByReqGrmtID = Backbonefire.Firebase.Collection.extend({
	initialize:function(qsid){
		this.url = ref.child('swaps').orderByChild('request_garment').equalTo(qsid)
	}
})

var GarmentModel = Backbonefire.Firebase.Model.extend({
	initialize: function(id){
		this.url = `https://wabisabi.firebaseio.com/garments/${id}`
	}
})

//views

var LogInView = React.createClass({
	email:"",
	password:"",
	// userName:"",

	_handleSignUp:function(){
		this.props.createUser(this.email,this.password) //,this.userName 
	},

	_handleLogIn:function(){
		this.props.logUserIn(this.email,this.password)
	},

	_getEmail: function(e){
		this.email = e.target.value
	},

	_getPasword: function(e){
		this.password = e.target.value
	},

	// _getUserName: function(e){
	// 	this.userName = e.target.value
	// },


	render: function(){
		return(

			<div>

				<div id="halfColor"></div>

				<div id="logoDiv">
					<h1 className="wabiLogo">wabi</h1>
					<h1 className="sabiLogo">sabi</h1>
				</div>

					<h5 id="wabisabiInfo">finding beauty in imperfection...</h5>


				<div className="logInContainer">
						<input type="text" id="logInEmail" placeholder="Email" onChange={this._getEmail}/><br/>
						<input type="password" id="logInPassword" placeholder="Password" onChange={this._getPasword}/><br/>
						<input onClick={this._handleLogIn} className="logInbutton" type="submit" defaultValue="Log In"/>

				</div>

				<div className="signUpContainer">
					<input type="text" id="email" placeholder="Email" onChange={this._getEmail}/><br/>
					<input type="password" id="password" placeholder="Password" onChange={this._getPasword}/><br/>
					<input onClick={this._handleSignUp} className="button" type="submit" defaultValue="Sign Up"/>

				</div>	


			</div>

		//<input type="text" id="username" placeholder="Username" onChange={this._getUserName}/> <br/> //goes between password and signup Button

		)
	}
})

var ClosetView = React.createClass({

	getInitialState: function(){
		return{
			closetItems: [],
		}
	},

	componentDidMount: function(){
		var component = this
		
		function fetchNReturnUserCloset(){
			var currentUserID = fbRef.getAuth().uid //the user that is loggedIn
			var qg = new QueryGarmentsByUID(currentUserID) //a new instance of queryGarment
			console.log("trying to fecth the current query...", qg)
			
			qg.fetch()
			qg.on("sync", function(){ //run a callback to create a new element
				console.log("garmentsQuery SINKED!", qg)
				component.setState({
					closetItems: qg.models
				})	
			})

			// poll again....
			setTimeout(function(){
				component.setState({
					closetItems: qg.models
				})	
			},2000)


			return qg
		}

		
		this.usrClstColl = fetchNReturnUserCloset()

		
		Backbonefire.Events.on("newItemInCloset", function(garmentObj){
			var grmntColl = new GarmentsCollection
			var addedGarmentModelData = grmntColl.create(garmentObj) // creates new obj node on firebase
			
			var newModl = new GarmentModel(addedGarmentModelData.id) // create model instance for local-state models array  
			
			var modelListCopy  = component.state.closetItems.map(function(m){ return m }  ) //create transformed copy of usrClstColl.models array
			console.log(modelListCopy)
			modelListCopy.push(newModl)

			component.setState({
				closetItems: modelListCopy
			})	
			
		
		})

	},

	componentWillUnmount: function(){
		this.usrClstColl.off()
		Backbonefire.Events.off()

	},

	_makePostComponent: function(m){
		return <SingleClosetPost mdl={m} />
	},

	render: function(){
		return(
			<div>

				<div>
					<SlideBar closetItems={this.state.closetItems} update={this.props.update}/>
					<h3 className="logo">wabisabi</h3> <br/> <br/>
					<a id="logout" href="#logout">log out</a>
					<a id="silkroad" href="#silkroad">silkroad</a>
				</div>	

				<div id="closetSpace">
					<h3>your closet space...</h3>
					{this.state.closetItems.map(this._makePostComponent)} 
				</div> 

				<div id="pendingSwaps">
					<h3>pending swaps...</h3>

				</div>

			</div>
		)
	}
})

var SilkRoadView = React.createClass({
	getInitialState:function(){
		return{
			silkRoadItems: [],
		}
	},

	componentDidMount: function(){
		console.log("mount ted")
		var self = this
		var gc = new GarmentsCollection()
		gc.fetch()


		gc.once("sync", function(){
			// console.log(gc)
			console.log(gc.models)
			var filteredgc = gc.models.filter(function(garmentModel){

				console.log('currentUsrId', ref.getAuth().uid)
				console.log('iteratedId', garmentModel.get("uid"))
				console.log('=================')

				if (garmentModel.get("uid") != ref.getAuth().uid){ // if garment modles uid is the same as the logged in uid
					return true
				}else{

					return false
				}
			})
			console.log(filteredgc)


			self.setState({
				silkRoadItems: filteredgc
			})
		})
	},

	_makePostComponent: function(m){
		return <SingleSilkRoadPost mdl={m} />
	},

	render: function(){
		return(
			<div>
				<div>
					<h3 className="logo">wabisabi</h3> <br/> <br/>
					<a id="silkLogout" href="#logout">log out</a>
					<a id="closet" href="#closet">closet</a>

				</div>	

				<div id="silkSpace">
					<h3>silk road...</h3>
					{this.state.silkRoadItems.map(this._makePostComponent)}

				</div> 

			</div>	
		)
	}
})

var GarmentInfoView = React.createClass({

	componentDidMount: function(){
		// console.log("garment mounted")
		var self = this

		this.props.gm.on("sync", function(){
			self.forceUpdate()
		})

		this.props.swapRequests.on("sync", function(){
			self.forceUpdate()
		})

		Backbonefire.Events.on("requesterSelected", function(mod){
			console.log("swap", mod)
			var reqId = mod.get('requester_id')
			var rqg = new QueryGarmentsByUID(reqId)
			rqg.fetch()

			rqg.once("sync", function(){
				self.setState({
					requesterCloset: rqg,
					swapModel: mod
				})
				// console.log("after sync",rqg)
			})
		})
	},

	getInitialState: function() {
		return {
			requesterCloset: [],
			swapModel: null
		}
	},

	_makePostComponent: function(m){
		return <SingleRequesterClosetPost mdl={m} />
	},

	render: function(){
		// console.log("this is what you need",this.props.gm)
		console.log(this.state)
		return(	

				<div>

					<div>
						<h3 className="logo">wabisabi</h3> <br/> <br/>
						<a id="logoutGV" href="#logout">log out</a>
						<a id="silkroadGV" href="#silkroad">silkroad</a>
						<a id="closetGV" href="#closet">closet</a>
					</div>	

					<div>
						<Garment gm={this.props.gm} />
					</div>

					<div id="swapRequestors">
						<h3 id="h3Requester" >requesters...</h3>
						<Requestors swapRequests={this.props.swapRequests} />
					</div>

					<div id="requestorsCloset">
						<h3>requester's closet...</h3>
						{this.state.requesterCloset.map(this._makePostComponent)}
					</div>

				</div>
			)
	}
})

//components
var Garment = React.createClass({
	render: function() {
		// console.log("workworkwork",this.props.gm)
		// console.log('content>>>',this.props.gm.get('content'))

		return (
				<div id="garmentSpace">

					<h3>garment requested...</h3>
					<div id="currentGarment">
						<img id="closetPic" src={this.props.gm.get("image_data")} height="400" width="400" onClick={this._handleHashChange}/> <br/>
						{this.props.gm.get("content")}
					</div>

				</div>
			)
	}
})

var Requestors = React.createClass({
	_makeRequestorComponent: function(swapMdl){
		return <SingleRequestor sm={swapMdl} />
	},

	render:function(){
		return(
			<div>
				{
					this.props.swapRequests
						.filter(function(mod){ return typeof mod.id !== "undefined" }) //filter out ghost models
						.map(this._makeRequestorComponent)
				}
			</div>
			)
	}
})

var SingleRequestor = React.createClass({

	_viewRequestorCloset:function(){
		Backbonefire.Events.trigger("requesterSelected", this.props.sm)
	},

	render: function(){ 
		// console.log("requester ID", this.props.sm.get('requester_id'))
		return(
			<div id="requestorPost" onClick={this._viewRequestorCloset}>
				{this.props.sm.get("requester_email")}

			</div>

		)
	}
})

var SingleClosetPost = React.createClass({

	_removeGarment: function(mdl){
		this.props.mdl.destroy(mdl)
		window.location.reload()
	},

	_handleHashChange: function(){
		window.location.hash = `garment/${this.props.mdl.id}` 
	},

	render: function(){
		// console.log("look at me",this.props.mdl)
		return(

			<div className="garmentPost">

				<button onClick={this._removeGarment.bind(this, this.props.mdl)} className="functionButtons">✕</button>
				<img id="closetPic" src={this.props.mdl.get("image_data")} height="200" width="200" onClick={this._handleHashChange}/> <br/>
				{this.props.mdl.get("content")}
			</div>
		)
	}
})

var SingleRequesterClosetPost = React.createClass({
		_respondSwap: function(mdl) {
		// console.log('mdl', mdl)
		var self = this 
		var sc = new SwapsCollection
		var swapObj = {
			request_garment: mdl.id,
			target_user_id: mdl.get('uid'),
			requester_id: fbRef.getAuth().uid,
			requester_email: fbRef.getAuth().password.email,
			stage: "requested"
		}
		// console.log(swapObj)

		var addedSwap = sc.create(swapObj) 
		 window.alert("This item has been requested.")
		 swapObj.id = addedSwap.id
	},

	render: function(){
		return(

			<div className="RequesterClosetPost">
				<button className="functionButtons">✓</button>
				<img id="closetPic" src={this.props.mdl.get("image_data")} height="200" width="200" onClick={this._handleHashChange}/> <br/>
				{this.props.mdl.get("content")}
			</div>

		)
	}
})

var SingleSilkRoadPost = React.createClass({

	_initiateSwap: function(mdl) {
		// console.log('mdl', mdl)
		var self = this 
		var sc = new SwapsCollection
		var swapObj = {
			request_garment: mdl.id,
			target_user_id: mdl.get('uid'),
			requester_id: fbRef.getAuth().uid,
			requester_email: fbRef.getAuth().password.email,
			stage: "requested"
		}
		// console.log(swapObj)

		var addedSwap = sc.create(swapObj) 
		 window.alert("This item has been requested.")
		 swapObj.id = addedSwap.id
	},

	render: function(){
		// console.log("look at me",this.props.mdl)
		return(
			<div className="silkRoadGarmentPost">

				<button className="functionButtons" onClick={this._initiateSwap.bind(this, this.props.mdl)}>+</button>
				<img id="closetPic" src={this.props.mdl.get("image_data")} height="200" width="200" /> <br/>
				{this.props.mdl.get("content")}
			</div>
		)
	}	
})

var SlideBar = React.createClass({
	getInitialState: function(){
		return{
			imageEl: <img />,
			imageLoaded: false,
			imageData: null
		}

	},

	_handlePreview: function(e){
		var inputEl = e.target
		this.imageFile = inputEl.files[0]

		var self = this
		// console.log('change heard on element!!!')
		var reader = new FileReader()

		reader.readAsDataURL(e.target.files[0])

		reader.onload = function(e){
			console.log('done!!!')

			self.setState({
				imageEl: <img id="picPreview" src={e.target.result} height="300" width="300" alt="your image" />,
				imageLoaded: true,
				imageData: e.target.result

			}) 
		}
	},

	_setDescription: function(e){
		this.setState({
			description: e.target.value 
		})
	},

	_submitToFB: function(){ // 2) this collects data for a new object 
		var self = this, 
			garmentObj = {
					uid: fbRef.getAuth().uid,
					image_data: self.state.imageData,
					content: self.state.description,
					description: ''

				}



		Backbonefire.Events.trigger("newItemInCloset", garmentObj)
		this.refs.hamburgerIcon.click()

		this.setState({
			description: '',
			imageLoaded: false,
			imageEl: <img />
		})





	},

	_showImgActionButt:function(loadStatus){
		if(loadStatus === true){
			return(
				<button className="barButton" onClick={this._clearImg}>Cancel</button>
				)
		} else {
			return(
				<input type="file" id="picUploader" accept="image/*" onChange={this._handlePreview} ref="currentImg"/> 
				)
		}
	},

	_clearImg: function(){
		this.setState({
			imageLoaded: false,
			imageEl: <img />
		})
	},

	_showSubmitButt:function(loadStatus){
		if(loadStatus === true)
			return(
				<button className="barButton" onClick={this._submitToFB}>Submit</button>
				)
	},

		render: function() {

			return (
				<div className="crazySlidBar">


					<label for="sideBarToggler" className="toggle">☰</label>
					<input id="sideBarToggler" type="checkbox" ref={"hamburgerIcon"}/>
					

					<div className="slideBar" >
						<h5>upload your clothes</h5> <hr/>

				
						
						{this.state.imageEl} <br/>
						{this._showImgActionButt(this.state.imageLoaded)} <br/> 

						<textarea type="text" id="description" placeholder="description..." onChange={this._setDescription} value={this.state.description}/> <br/>
						{this._showSubmitButt(this.state.imageLoaded)}

		           	</div>

	           </div>
        )
    }
})

function app() {
	//router

	var AppRouter = Backbonefire.Router.extend({
		routes: {
			"login": "showLogIn",
			"closet": "showCloset", //user's closet, can upload more items 
			"garment/:gid" : "showGarmentInfo",
			"silkroad": "showSilkRoad", //view all uploads
			"logout": "doLogOut", 
			"*default": "showLogIn" 
		},

		initialize: function() {
			this.ref = new Firebase("https://wabisabi.firebaseio.com/")
			window.ref = this.ref

			if (!this.ref.getAuth()) {
				location.hash = "login"
			}

			this.on("route", function(){
				if (!this.ref.getAuth()){
					location.hash = "login"
				}
			})
		},

			doLogOut: function(){
				this.ref.unauth() // returns as null
				location.hash = "login"
			},

			showLogIn:function(){
				console.log("keep calm and log on")
				DOM.render(<LogInView logUserIn={this._logUserIn.bind(this)} createUser={this._createUser.bind(this)}/>, document.querySelector(".container"))
			},

			showCloset: function(){
				console.log("showing closet")
				DOM.render(<ClosetView update={this._update}/>, document.querySelector(".container"))
			},

			showSilkRoad: function(){
				console.log("showing silkRoad")
				var swaps = new SwapsCollection()
				DOM.render(<SilkRoadView />, document.querySelector(".container"))
			},

			showGarmentInfo: function(gid){
				console.log(gid)
				// console.log(qsid)
				var gm = new GarmentModel(gid)
				var swapRequests = new QuerySwapByReqGrmtID(gid)
				console.log(gm)
				console.log(swapRequests)
				DOM.render(<GarmentInfoView gm={gm} swapRequests={swapRequests} />, document.querySelector(".container"))
			},

			_logUserIn: function(email,password){
				console.log(email,password)
				this.ref.authWithPassword({
					email:email,
					password:password
				},
					function(err,authData){
						if(err){
							console.log(err)
						} else{
							location.hash ="closet"
						}
					})
			},

			_createUser: function(email,password){ //,userName
				console.log(email,password)
				var self = this
				this.ref.createUser({
					email:email,
					password:password,
				},
					function(err,authData){
						if(err) {
							console.log(err)
						}else{
							var userMod = new UserModel(authData.uid)
							userMod.set({ //username: userName,
								email: email,
								id: authData.uid
							})
							self._logUserIn(email,password)
						}
					})
			},

			_update: function(){
				window.location.reload()
			},


	})


	var ap = new AppRouter()
	Backbonefire.history.start()
}


app()
