var steps = [];

//call the function doAll("...") to get the simplified equation returned.
function doAll(equation){
	steps = [];
	equation = equation.split(" ").join(""); //remove all whitespace for simplicity
	equation = equation.split("--").join("+"); //double negative = pos
	if(equation.includes("=")){ 
		//moves all to 1 side. For example,
		// x=1+y becomes x-(1+y)=0
		equation = equation.split("=").join("-(");
		equation += ")";
		addStep("Move to One Side",equation+" = 0");
		var equalsZero = true; //whether or not the answer should end in ' = 0'
	}else{
		var equalsZero = false;
	}
	equation = simplify(equation);
	equation = combLikeTerms(equation);
	if(equalsZero){
		equation += " = 0";
	}
	return {
		ans: equation,
		steps: steps
	};
}

function simplify(equation){
	equation = addSub(equation); //first deal with addition and subtraction
	return equation;
}

function combLikeTerms(equation){
	var parts = splitAddSub(equation)[0];
	var addOrSub = splitAddSub(equation)[1];
	var original = equation;

	var vars = [];
	var coefs = [];
	for (var i = 0; i < parts.length; i++) {
		var mulParts = splitMulDiv(parts[i])[0];
		var addCoef = 1;
		var addVar = [];
		for(var j = 0; j<mulParts.length; j++){
			if(!isNaN(mulParts[j])){
				addCoef = percise(addCoef*mulParts[j]);
			}else{
				addVar.push(mulParts[j]);
			}
		}
		if(addOrSub[i] == "-"){
			addCoef *= -1;
		}
		addVar.sort();
		addVar = addVar.join("");
		if(vars.indexOf(addVar) != -1){
			coefs[vars.indexOf(addVar)] = percise(coefs[vars.indexOf(addVar)]+addCoef);
		}else{
			vars.push(addVar);
			coefs.push(addCoef);
		}
	}
	var toR = [];
	for (i = 0; i < vars.length; i++) {
		if(coefs[i] == 0){
		}else if(coefs[i] == 1 && vars[i].length == 0){
			toR.push("1");
		}else if(coefs[i] == 1){
			toR.push(vars[i]);
		}else if(coefs[i] == -1 && vars[i].length>0){
			toR.push("-"+vars[i]);
		}else{
			toR.push(coefs[i]+vars[i]);
		}
	}
	if(toR.length == 0){
		return "0";
	}
	if(original != toR.join(" + ")){
		addStep("Combine like terms",equation+" = ");
	}
	return toR.join(" + ");
}

function addSub(equation){
	var parts = splitAddSub(equation)[0]; // splits it by + and -
	var addOrSub = splitAddSub(equation)[1]; // which are + and which are -
	var original = equation; //the original equation

	var nums = 0; //the number parts
	var vars = []; //the non-number parts
	for (var i = 0; i < parts.length; i++) {
		if(!isNaN(parts[i]) && parts[i] != 0){
			//it is a number
			if(addOrSub[i] == "+"){
				nums = percise(nums+parseFloat(parts[i])); //add the number. percise() gets rid of JavaScript float problems
			}else{
				nums = percise(nums-parseFloat(parts[i])); //subtract the number.
			}
		}else if(isParenth(parts[i])){
			//something in parentheses
			if(addOrSub[i] == "+"){
				vars.push(simplify(parts[i].slice(1,-1))); //simplify the inside and then add that to vars
			}else{
				vars.push(multiplyDivide("-1*("+simplify(parts[i].slice(1,-1))+")")); //simplify the inside and then multiply it by -1
			}
		}else if(splitMulDiv(parts[i]).length>1 || parts[i].includes("^")){
			//it is multiplication or division or exponents
			if(addOrSub[i] == "+"){
				vars.push(multiplyDivide(parts[i])); //handle multiplication and division and exponents
			}else{
				vars.push(multiplyDivide("-"+parts[i])); //handle multiplication and division and exponents for the negative
			}
		}else if(parts[i] == ""){
			//don't do anything if it is empty
		}else{
			//it is just a variable
			if(addOrSub[i] == "+"){
				vars.push(parts[i]);
			}else{
				vars.push("-"+parts[i]);
			}
		}
	}
	//returning the result...
	if(nums == 0){
		//there are no numbers so just return the variables
		if(parts.length > 1 && original != vars.join("+")){
			//only add a step if something changed
			addStep("Add",original+" = "+vars.join("+"));
		}
		return vars.join("+");
	}else{
		//there are some numbers so return the numbers and variables
		if(parts.length > 1 && original != vars.join("+")){
			//only add a step if something changed
			addStep("Add",original+" = "+vars.join("+")+"+"+nums);
		}
		return vars.join("+")+"+"+nums;
	}
}

function multiplyDivide(equation){
	var original = equation;
	var tempList = splitMulDiv(equation);
	var parts = tempList[0]; //split by multiplication and division
	var mulOrDiv = tempList[1]; //tells where is multiplication and where is division
	var justExponent = true; //if it is just exponents, don't add a step

	var rParts = [{
		vars: [],
		nums: 1
	}];
	for (var i = 0; i < parts.length; i++) {
		if(!isNaN(parts[i])){
			justExponent = false;
			//multiplies by mulBy later on.
			if (mulOrDiv[i] == "*"){
				var mulBy = parts[i];
			}else if (mulOrDiv[i] == "/"){
				var mulBy = 1/parts[i];
			}
			//multiply each one by the num
			for (var j = 0; j < rParts.length; j++) {
				rParts[j].nums = percise(rParts[j].nums*mulBy);
			}
		}else{
			if(splitExp(parts[i]).length > 1){
				//exponent
				parts[i] = "("+exponent(parts[i])+")"; //see the exponent function
			}
			if(isParenth(parts[i])){
				justExponent = false;
				var nextPart = simplify(parts[i].slice(1,-1));
				var addOrSub = splitAddSub(nextPart)[1];
				nextPart = splitAddSub(nextPart)[0];//the add/sub parts of this equation

				var newRParts = [];
				for (var j = 0; j < rParts.length; j++) {
					for (var k = 0; k < nextPart.length; k++) {
						//multiply each part of the previous equation
						var toAdd = {
							vars: rParts[j].vars.slice(), //new list from this so when this changes, the original won't change.
							nums: rParts[j].nums
						};
						if(!isNaN(nextPart[k])){
							//it is a number so multiply/divide by it
							if(addOrSub[k] == "+"){
								toAdd.nums = percise(toAdd.nums*nextPart[k]);
							}else{
								toAdd.nums = percise(toAdd.nums*-1*nextPart[k]);
							}
						}else{
							//it is a variable
							if(addOrSub[k] == "-"){
								toAdd.nums *= -1;
							}
							toAdd.vars.push(nextPart[k]);
						}
						newRParts.push(toAdd);
					}
				}
				rParts = newRParts;
			}else{
				justExponent = false;
				//it is a variable
				for (var j = 0; j < rParts.length; j++) {
					rParts[j].vars.push(parts[i]);
				}
			}
		}
	}
	var toR = []; //the result to return
	for (var i = 0; i < rParts.length; i++) {
		if(rParts[i].nums == 1 && rParts[i].vars.length == 0){
			toR.push("1");
		}else if(rParts[i].nums == 1){
			//don't include the number if it is 1
			toR.push(rParts[i].vars.join(""));
		}else if(rParts[i].nums == 0){
			//don't do anything!
		}else if(rParts[i].vars.length == 0){
			//if no variables
			toR.push(rParts[i].nums);
		}else{
			//there is a variable and a number.
			toR.push(rParts[i].nums +"*"+ rParts[i].vars.join(""));
		}
	}
	if(original != toR.join("+") && !justExponent){
		addStep("Multiply",original+" = "+toR.join("+"));
	}
	return toR.join("+");
}

function exponent(equation){
	var parts = splitExp(equation); //split by "^" (it is a list)
	var i = parts.length-1; //i starts at the end
	while (i > 0) { //repeat as long as it isn't the first in the list of parts
		var simplified = simplify(parts[i]);
		if(!isNaN(simplified) && simplified%1 == 0){ //it is a whole number
			parts[i] = simplified;
			parts[i-1] = [parts[i-1]];//turn previous one into a list
			for (var j = 1; j < parts[i]; j++) {
				parts[i-1].push(parts[i-1][0]);//add this many times
			}
			parts[i-1] = parts[i-1].join("*");//join by multiplication
			parts[i-1] = simplify(parts[i-1]);//multiply it out
			parts.pop();//remove the exponent part
		}else{
			parts[i-1] = "("+parts[i-1]+"^"+parts[i]+")";
			parts.pop();
		}
		i--;
	}
	return parts[0];
}

//check if an equation part is all in parentheses
function isParenth(equation){
	var toR = equation.length>1; //the thing to return. if it is just one char long, then it is false.
	var i = 0;
	var inParen = 0;
	while (i < equation.length-1) {
		if (equation[i] == "("){
			inParen ++;
		}else if(equation[i] == ")"){
			inParen --;
		}
		if(inParen == 0){
			toR = false;
		}
		i++;
	}
	return toR;
}
function splitMulDiv(equation){
	var parts = []; //will store it split by multiplication and division
	var i = 0;
	var inParen = 0;
	var mulOrDiv = ["*"];//which are multiplication and which are division
	while (i < equation.length) {
		if (equation[i] == "("){
			inParen ++;
		}else if(equation[i] == ")"){
			inParen --;
		}

		if(inParen == 0){//if not in parentheses
			if (equation[i] == "*" && i!=0){//it is multiplication and there is something to the right and left of it
				parts.push(equation.slice(0,i));//add a part
				mulOrDiv.push("*");
				equation = equation.slice(i+1);
				i = 0;
			}else if (equation[i] == "/" && i!=0){//it is division and there is something to the right and left of it
				parts.push(equation.slice(0,i));//add a part
				mulOrDiv.push("/");
				equation = equation.slice(i+1);
				i = 0;
			}else if (isVarOrNum(equation[i]) && isVarOrNum(equation[i+1])  && equation[i+1] != undefined){
				if(isVar(equation[i]) || isVar(equation[i+1])){
					//it is multiplication of two variables/parentheses
					parts.push(equation.slice(0,i+1));
					mulOrDiv.push("*");
					equation = equation.slice(i+1);
					i = 0;
				}else{
					i++;
				}
			}else{
				i++;
			}
		}else{
			i++;
		}
	}
	parts.push(equation); //add the part of the equation left over.
	return [parts,mulOrDiv];
}
function splitAddSub(equation){
	var parts = [];
	var addOrSub = ["+"];//which parts are added and which are subtracted
	var i = 0;
	var inParen = 0;
	while (i < equation.length) {
		if (equation[i] == "("){
			inParen ++;
		}else if(equation[i] == ")"){
			inParen --;
		}
		if(inParen == 0){
			if (equation[i] == "+" && equation[i+1] != "-"){//it is _+_
				parts.push(equation.slice(0,i));
				equation = equation.slice(i+1);
				i = 0;
				addOrSub.push("+");
			}else if(equation[i] == "+" && equation[i+1] == "-"){//it is _+-_
				equation = equation.slice(0,i)+equation.slice(i+1);
			}else if(equation[i] == "-"){//it is _-_
				if(equation.slice(0,i) == ""){
					addOrSub.pop();
					addOrSub.push("-");
				}else{
					parts.push(equation.slice(0,i));
					addOrSub.push("-");
				}
				equation = equation.slice(i+1);
				i = 0;
			}else{
				i++;
			}
		}else{
			i++;
		}
	}
	parts.push(equation);//add whatever is left to the list.
	return [parts,addOrSub];
}
function splitExp(equation){
	var parts = [];
	var addOrSub = ["+"];
	var i = 0;
	var inParen = 0;
	while (i < equation.length) {
		if (equation[i] == "("){
			inParen ++;
		}else if(equation[i] == ")"){
			inParen --;
		}
		if(inParen == 0){
			if (equation[i] == "^"){
				//it is an exponent so add it
				parts.push(equation.slice(0,i));
				equation = equation.slice(i+1);
				i = 0;
			}else{
				i++;
			}
		}else{
			i++;
		}
	}
	parts.push(equation);//add whatever is left to the list.
	return parts;
}

function addStep(type, text){
	steps.push([type,text]);
}
function isVar(x){
	return "abcdefghijklmnopqrstuvwxyz()".includes(x);
}
function isVarOrNum(x){
	return "abcdefghijklmnopqrstuvwxyz1234567890()".includes(x);
}
function percise(x,numDigs=8){
	return Math.round(x*10**numDigs + Number.EPSILON)/10**numDigs;
}
