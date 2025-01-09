export class BlendShapeController {
  constructor(vrm) {
    this.vrm = vrm;
    this.expressionManager = vrm.expressionManager;
    
    // Log full expressions info
    console.log('🔍 VRM Expressions:', this.expressionManager?.expressions)
    
    // Log actual blend shape names
    if (this.expressionManager?.expressions) {
      console.log('📦 Available expressions:')
      Object.entries(this.expressionManager.expressions).forEach(([key, exp]) => {
        console.log(`- ${key}:`, exp)
      })
    }
  }

  updateVRM() {
    if (this.vrm && typeof this.vrm.update === 'function') {
      this.vrm.update();
    }
  }

  setExpression(name, weight = 1.0) {
    try {
      if (!this.expressionManager?.expressions) return;

      // Handle both old and new format
      const expressionName = typeof name === 'object' ? name.name : name;
      const expressionWeight = typeof name === 'object' ? name.weight : weight;
      
      // Reset all expressions to 0 first
      Object.entries(this.expressionManager.expressions).forEach(([key, exp]) => {
        if (exp && typeof exp.weight !== 'undefined') {
          exp.weight = 0;
        }
      });

      // Set new expression
      const targetExpression = this.expressionManager.expressions[expressionName];
      if (targetExpression && typeof targetExpression.weight !== 'undefined') {
        targetExpression.weight = expressionWeight;
        this.updateVRM();
        console.log(`✅ Set expression: ${expressionName} = ${expressionWeight}`);
      } else {
        // Fallback to neutral
        const neutralExp = this.expressionManager.expressions['neutral'];
        if (neutralExp && typeof neutralExp.weight !== 'undefined') {
          neutralExp.weight = 1.0;
          console.log('⚠️ Expression not found, using neutral');
        }
      }
    } catch (error) {
      console.warn(`⚠️ Error setting expression ${name}:`, error);
      // Fallback to neutral
      try {
        const neutralExp = this.expressionManager?.expressions?.neutral;
        if (neutralExp && typeof neutralExp.weight !== 'undefined') {
          neutralExp.weight = 1.0;
        }
      } catch (e) {
        console.warn('❌ Failed to set neutral expression:', e);
      }
    }
  }

  setMouthShape(shape, weight = 1.0) {
    try {
      if (!this.expressionManager?.expressions) return;

      const targetShape = this.expressionManager.expressions[shape];
      if (targetShape && typeof targetShape.weight !== 'undefined') {
        targetShape.weight = weight;
        this.updateVRM();
        console.log(`✅ Set mouth shape: ${shape} = ${weight}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error setting mouth shape ${shape}:`, error);
    }
  }

  blink(weight = 1.0) {
    try {
      if (!this.expressionManager?.expressions) return;

      const blinkExp = this.expressionManager.expressions['blink'];
      if (blinkExp && typeof blinkExp.weight !== 'undefined') {
        blinkExp.weight = weight;
        this.updateVRM();
        console.log(`✅ Set blink = ${weight}`);
      }
    } catch (error) {
      console.warn(`⚠️ Error setting blink:`, error);
    }
  }

  reset() {
    try {
      if (!this.expressionManager?.expressions) return;

      // Reset all expressions to 0
      Object.entries(this.expressionManager.expressions).forEach(([key, exp]) => {
        if (exp && typeof exp.weight !== 'undefined') {
          exp.weight = 0;
        }
      });
      
      // Set neutral to 1
      const neutralExp = this.expressionManager.expressions['neutral'];
      if (neutralExp && typeof neutralExp.weight !== 'undefined') {
        neutralExp.weight = 1;
        this.updateVRM();
        console.log('✅ Reset to neutral');
      }
    } catch (error) {
      console.warn(`⚠️ Error resetting expressions:`, error);
    }
  }
} 